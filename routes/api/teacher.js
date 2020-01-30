const http=require('http');
const querystring=require('querystring');
const async = require('async');

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
		// console.log('sending post request to mis');
		//  	// Build the post string from an object
		//  	var post_data = querystring.stringify({
		//      	'compilation_level' : 'ADVANCED_OPTIMIZATIONS',
		//      	'output_format': 'json',
		//      	'output_info': 'compiled_code',
		//        'warning_level' : 'QUIET',
		//        'js_code' : 'codestring'
		//  	});

		//  	// An object of options to indicate where to post to
		//  	var post_options = {
		//      	host: 'iut-files.mis.uz',
		//      	port: '80',
		//     	path: '/file-upload.php',
		 //      	method: 'POST',
		 //      	headers: {
		 //          	'Content-Type': 'application/x-www-form-urlencoded',
		 //          	'Content-Length': Buffer.byteLength(post_data)
		 //      	}
		 //  	};

		 //  	// Set up the request
		 //  	var post_req = http.request(post_options, function(resp) {
		 //    	resp.setEncoding('utf8');
		 //      	resp.on('data', function (chunk) {
		 //          	console.log('Response: ' + chunk);
		 //          	res.end();
		 //      	});
		 //  	});

		 //  	// post the data
		 //  	post_req.write(post_data);
		//  	post_req.end();
		let b=req.body;
		if(b && b.teacherId && b.filename){
			let f = new File({
				name:b.filename,
				teacher:b.teacherId,
			});

			return res.json(f);
		}else{
			return res.json({
				result:'error',
				message:'all data is not provided'
			});
		}

		function attendance(data){
			console.log('requesting to iut-attendance...');
			data = JSON.stringify(data);
			const options = {
			  	hostname: 'iut-attendance.herokuapp.com',
			  	port: 443,
			  	path: '/api/lecture/attendance',
			  	method: 'POST',
			  	headers: {
			    	'Content-Type': 'application/json',
			    	'Content-Length': data.length
			  	}
			}
			const req = https.request(options, res => {
			  	console.log(`statusCode: ${res.statusCode}`)

			  	res.on('data', d => {
			  		console.log('request to iut-attendance finished...');
			    	process.stdout.write(d)
			  	});
			});

			req.on('error', error => {
			  	console.error(error)
			});

			req.write(data)
			req.end();
		}
	}
}

module.exports=teacherAPI;