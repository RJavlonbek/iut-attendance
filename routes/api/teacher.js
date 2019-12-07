var keystone=require('keystone');
var Section=keystone.list('Section').model;
var Teacher=keystone.list('Teacher').model;
var Lecture=keystone.list('Lecture').model;
var Student=keystone.list('Student').model;

var teacherAPI={
	startAttendance:function(req,res,next){ // sends current lecture id as a token
		var teacherId=req.params.teacherId||'';
		//res.send('starting attendance');
		console.log('....starting attendance');
		Teacher.findOne({teacherId:teacherId},function(err,teacher){
			if(err) return next(err);
			if(teacher){
				console.log('teacher found '+teacher.firstname+' '+teacher.lastname);
				var now=new Date();
				var currentDay=now.getDay();
				var currenHour=now.getHours();
				var regexHour='/^'+currenHour+'/';
				Section.findOne({
					$or:[{
						'lectureOne.day':currentDay
						// 'lectureOne.time':{$regex:regexHour}
					},{
						'lectureTwo.day':currentDay
						// 'lectureTwo.time':{$regex:regexHour}
					}]
				}).populate({
					path:'teacher',
					match:{_id:teacher._id}
				}).exec(function(err,section){
					if(err) return next(err);
					if(section && section._id){
						console.log('section found '+section.number);
						Lecture.count({section:section._id,teacher:section.teacher._id},function(err,lecturesCount){ // counting lectures
							if(err) return next(err);
							console.log(lecturesCount+' lectures found for this section');
							Student.find({group:{$in:section.groups}},function(err,students){ //finding students of this section
								if(err) return next(err);
								if(students && students.length){
									console.log(students.length+' students found');
									//creating lecture
									console.log('creating lecture');
									var newLecture=new Lecture({
										students:{
											studentId:[''],
											attended:[0]
										},
										section:section._id,
										teacher:section.teacher._id,
										number:lecturesCount+1
									});
									

									//preparing students field
									for(var i=0;i<students.length;i++){
										newLecture.students.studentId[i]=students[i].studentId;
										newLecture.students.attended[i]=0;
									}
									newLecture.save(function(err,newLect){
										if(err) return next(err);
										res.json({
											status:'success',
											message:'qalesan?',
											section:section.number,
											token:newLect._id
										});
									});
								}else{
									res.json({
										status:'error',
										message:'No students found',
										result:students
									});
								}
							});
						});
					}else{
						res.json({
							status:'error',
							message:'No lectures found for teacher('+teacherId+')'
						});
					}
				});
			}else{
				res.json({
					status:'error',
					message:'Teacher not found ('+teacherId+')'
				});
			}
		})
	},
	login:function(req,res,next){
		var b=req.body;
		Teacher.findOne({
			teacherId:b.teacherId
		},function(err,teacher){
			if(err) return next(err);
			if(teacher && teacher._id){
				teacher._.password.compare(b.password,function(err,match){
					if(err) return next(err);
					if(match){
						res.json({
							status:'success',
							message:'molodets'
						});
					}else{
						res.json({
							status:'error',
							message:'paroling xato!'
						});
					}
				});
			}else{
				res.json({
					status:'error',
					message:'id ing xato!'
				});
			}
		});
	},
	getTimetable:function(req, res, next){
		const teacherId=req.params.teacherId||'';
		console.log('getting timetable for instructor '+teacherId);
		Teacher.findOne({teacherId},'_id',(err, teacher)=>{
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
		})
		
	}
}

module.exports=teacherAPI;