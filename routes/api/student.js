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
	}
}

module.exports=studentAPI;