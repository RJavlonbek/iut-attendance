const https=require('https');
const querystring=require('querystring');
const async = require('async');
const FormData=require('form-data');
const fs=require('fs');
const XLSX = require('xlsx');

var keystone=require('keystone');
var Section=keystone.list('Section').model;
var Teacher=keystone.list('Teacher').model;
var Lecture=keystone.list('Lecture').model;
var Student=keystone.list('Student').model;
var File   =keystone.list('File').model;
var Course =keystone.list('Course').model;

var teacherAPI={
	startAttendance:function(req,res,next){ // sends current lecture id as a token
		var teacherId=req.params.teacherId||'';
		//res.send('starting attendance');
		console.log('....starting attendance');
		Teacher.findOne({teacherId:teacherId},function(err,teacher){
			if(err) return next(err);
			if(!(teacher && teacher._id)){
				res.json({
					status:'error',
					message:'Teacher not found ('+teacherId+')'
				});
			}

			console.log('teacher found '+teacher.firstname+' '+teacher.lastname);
			var now=new Date();
			var currentDay=now.getDay();
			var currenHour=now.getHours();
			var regexHour='/^'+currenHour+'/';

			// Section.findOne({
			// 	$or:[{
			// 		'lectureOne.day':currentDay
			// 		// 'lectureOne.time':{$regex:regexHour}
			// 	},{
			// 		'lectureTwo.day':currentDay
			// 		// 'lectureTwo.time':{$regex:regexHour}
			// 	}]
			// })
			Section.findOne({}).populate({
				path:'teacher',
				match:{_id:teacher._id}
			}).populate({
				path:'course'
			}).exec(function(err,section){
				if(err) return next(err);
				if(!(section && section._id)){
					res.json({
						status:'error',
						message:'No lectures found for teacher('+teacherId+')'
					});
				}

				console.log('section found '+section.course.title+'('+section.number+')');
				Lecture.count({section:section._id,teacher:section.teacher._id},function(err,lecturesCount){ // counting lectures
					if(err) return next(err);
					console.log(lecturesCount+' lectures found for this section');
					Student.find({group:{$in:section.groups}},function(err,students){ //finding students of this section
						if(err) return next(err);
						if(!(students && students.length)){
							res.json({
								status:'error',
								message:'No students found',
								result:students
							});
						}

						console.log(students.length+' students found');
						//creating lecture
						console.log('creating lecture');
						var newLecture=new Lecture({
							students:students.map((st, index)=>st._id),
							section:section._id,
							attendedStudents:[],
							teacher:section.teacher._id,
							number:lecturesCount+1
						});
						
						newLecture.save(function(err,newLect){
							if(err) return next(err);
							res.json({
								status:'success',
								message:'done',
								students:students.map((st, i)=>st.studentId),
								section:section.number,
								course:section.course.title,
								lectureId:newLect._id
							});
						});
					});
				});
			});
		})
	},
	login:function(req,res,next){
		var b=req.body;
		console.log(b);
		async.parallel({
			teacher:function(cb){
				Teacher.findOne({
					teacherId:b.teacherId
				},function(err,teacher){
					if(err) return next(err);
					cb(null, teacher);
				});
			},
			student:function(cb){
				Student.findOne({
					studentId:b.teacherId
				}, function(err, student){
					if(err) return next(err);
					cb(null, student);
				});
			}
		}, function(err, results){
			if(err) return next(err);
			let response={};
			let user={};
			if(results.teacher && results.teacher._id){
				response.userType='teacher';
				user=results.teacher;
			}else if(results.student && results.student._id){
				response.userType='student';
				user=results.student;
			}else{
				res.json({
					status:'error',
					message:'user not found'
				});
			}

			response.user={
				_id:user._id,
				teacherId: user.studentId,
				firstname: user.firstname,
				lastname: user.lastname
			}

			if(user._){
				user._.password.compare(b.password, function(err,match){
					if(err) return next(err);
					if(match){
						res.json({
							...response,
							status:'success',
							message:'signed in'
						});
					}else{
						res.json({
							status:'error',
							message:'incorrect credentials'
						});
					}
				});
			}
		});
	},
	getTimetable:function(req, res, next){
		const teacherId=req.params.teacherId||'';
		console.log('getting timetable for instructor '+teacherId);
		Teacher.findOne({teacherId},'_id',(err, teacher)=>{
			if(err) return next(err);
			if(teacher && teacher._id){
				Section.find({
					teacher:teacher._id
				},'number lectureOne lectureTwo').populate({
					path:'groups',
					select:['title']
				}).populate({
					path:'course',
					select:['title']
				}).exec((err,sections)=>{
					if(err) return next(err);
					let lectures=[];
					sections=sections.map((section, index)=>{
						return {
							number: section.number,
							groups: section.groups,
							course: section.course,
							lectures:[section.lectureOne, section.lectureTwo]
						}
					});
					res.json(sections);
				});
			}else{
				res.json({
					result:'error',
					message:'teacher was not found for given id '+teacherId
				});
			}
		});
	},
	getReport: (req, res, next)=>{
		let aoa = [];
		const {excel, lectureId} = req.query;
		let jsonData=[{prop:'val', prop1: 'val1'},{prop:'val2', prop1: 'vall'}];

		if(lectureId){
			console.log('lecture id is given: '+lectureId);
			Lecture.findById(req.query.lectureId, 'number students attendedStudents').populate({
				path: 'students',
				select: ['studentId']
			}).populate({
				path:'section',
				select:['number'],
				populate: {path: 'course', select: ['title']}
			}).exec((err, lecture)=>{
				if(!(lecture && lecture._id)){
					return res.json({
						status: 'error',
						message: 'lecture not found'
					});
				}

				lecture.students.map((student, i)=>{
					let attended = (lecture.attendedStudents.indexOf(student._id) != -1);
					aoa.push([
						student.studentId,
						attended ? 1 : 0
					]);
				});

				if(excel){
					// adding header
					aoa.unshift(['Student ID', 'Lecture '+lecture.number]);

					/* generate workbook */
					var ws = XLSX.utils.aoa_to_sheet(aoa);
					var wb = XLSX.utils.book_new();
					XLSX.utils.book_append_sheet(wb, ws, lecture.section.course.title+' '+lecture.section.number);

					/* generate buffer */
					var buf = XLSX.write(wb, {type:'buffer', bookType:"xlsx"});

					/* send to client */
					res.set('Content-disposition', 'attachment; filename=' + 'report.xlsx');
					return res.status(200).send(buf);
				}else{
					return res.json({
						status:'success',
						message: '',
						data: aoa,
						course: lecture.section.course.title,
						section: lecture.section.number,
						lecture: lecture.number
					});
				}
			});
		}else{
			return res.json({
				status:'error',
				message:'lack of data'
			});
		}
	},
	findCourses:(req, res, next)=>{
		const teacherId=req.params.teacherId||'';

		Course.find({}, 'title', (err, courses)=>{
			if(err) return next(err);
			return res.json(courses);
		});
	},
	findSections:(req, res, next)=>{
		const teacherId=req.params.teacherId||'';

		Teacher.findOne({teacherId}, (err, teacher)=>{
			Section.find({teacher: teacher._id}, 'number').populate({
				path:'course',
				select:'title'
			}).exec((err, sections)=>{
				if(err) return next(err);
				return res.json(sections);
			});
		})
		
	},
	fileUpload:function(req, res, next){
		let file=req.files.file;
		let teacherId=req.params.teacherId;
		const {courseId, title} = req.body;

		if(!(file && file.originalname)){
			return res.json({
				result:'error',
				message:'file was not given'
			});
		}

		let extension=file.originalname.split('.').pop();

		async.parallel({
			course:(cb)=>{
				Course.findById(courseId, '', cb);
			},
			teacher:(cb)=>{
				Teacher.findOne({teacherId}, '', cb);
			}
		}, (err, results)=>{
			if(err) return next(err);
			const {teacher, course} = results;
			if(!(teacher && teacher._id)){
				return res.json({
					status:'error',
					message:'teacher not found'
				});
			}
			if(!(course && course._id)){
				return res.json({
					status: 'error',
					message: 'invalid courseId, course not found'
				});
			}

			let newFile = new File({
				name: title || file.originalname,
				teacher:teacher._id,
				course: course._id
			});

			newFile.url='https://iut-files.mis.uz/files/iut-attendance/'+newFile._id+'.'+extension;

			newFile.save((err, f)=>{
				if(err) return next(err);
				res.json({
					status:'success',
					message:'file informations are saved, now you should send this file to https://iut-files.mis.uz/file-upload.php with given filename',
					filename:f._id+'.'+extension
				});
			});
		});
	},
	findFiles:(req, res, next)=>{
		const teacherId=req.params.teacherId||'';

		Teacher.findOne({teacherId}, (err, teacher)=>{
			File.find({teacher: teacher._id}, 'name url').populate({
				path: 'course',
				select: ['title']
			}).exec((err, files)=>{
				if(err) return next(err);
				return res.json(files);
			});
		});
	},
	fileUploadWithRequest:function(req, res, next){
		let b=req.body;
		let file=req.files.file;

		if(!(file && file.originalname)){
			return res.json({
				result:'error',
				message:'all data is not provided'
			});
		}

		let f = new File({
			name:file.originalname,
			teacher:b.teacherId,
		});

		console.log('requesting to iut-files.mis.uz ...');
		//return res.json(file);
		data = new FormData();
		//data.append('file', fs.createReadStream(file.path));
		data.append('my_string', 'my_value');

		console.log('formData is ready...');
		const options = {
		  	hostname: 'iut-files.mis.uz',
		  	path: '/file-upload.php',
		  	method: 'POST'
		}

		const myReq = https.request(options);

		data.pipe(myReq);

		// 

		myReq.on('error', error => {
		  	console.error(error)
		});

		myReq.on('response', myRes => {
		  	console.log(`statusCode: ${myRes.statusCode}`)

		  	myRes.on('data', d => {
		  		console.log('request to iut-files.mis.uz finished...');
		    	process.stdout.write(d)
		  	});

		  	res.json({
		  		status:'success',
		  		message: 'file-uploaded'
		  	});
		});

		//myReq.write(data);
		myReq.end();
	}
}

module.exports=teacherAPI;