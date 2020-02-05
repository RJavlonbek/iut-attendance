var keystone=require('keystone');
var Section=keystone.list('Section').model;
var Lecture=keystone.list('Lecture').model;
var Student=keystone.list('Student').model;

var studentAPI={
	checkAttendance:function(req,res,next){
		var studentId=req.params.studentId
		var b=req.body;
		var lectureId=b.token;
		Lecture.findOne({_id:lectureId},function(err,lecture){
			if(err) return next(err);
			if(lecture && lecture._id){
				for(var i=0;i<lecture.students.length;i++){
					if(lecture.students.studentId[i]==studentId){
						lecture.students.attended[i]=1;
					}
				}
			}
		});
	},
	findStudents:(req, res, next)=>{
		let query={};
		if(req.query.groupId){
			query={
				...query,
				group:req.query.groupId
			}
		}

		Student.find(query, 'studentId firstname lastname').populate({
			path:'group',
			select:['title']
		}).exec((err, students)=>{
			if(err) return next(err);
			res.json(students);
		});
	},
	currentAttendance:(req, res, next)=>{
		const {studentId} = req.params;
		Student.findOne({studentId}, '', (err, student)=>{
			if(!(student && student._id)){
				return res.json({
					status: 'error',
					message: 'student no found'
				});
			}

			Lecture.findOne({}, {}, {
				sort: {'created_at' : -1}
			}).populate({
				path:'section',
				select:['number'],
				populate:{
					path:'course',
					select:['title']
				}
			}).exec((err, lecture)=>{
				if(!(lecture && lecture._id)){
					return res.json({
						status: 'error',
						message: 'lecture not found'
					});
				}
				let attended = (lecture.attendedStudents.indexOf(student._id) != 1)
				res.json({
					status: 'success',
					message: '',
					attended,
					course: lecture.section.course.title,
					section: lecture.section.number
				});
			});
		});
	},
	getReport:(req, res, next)=>{
		res.end();
	}
}

module.exports=studentAPI;