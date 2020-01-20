const keystone=require('keystone');

var Lecture=keystone.list('Lecture').model;
var Student=keystone.list('Student').model;

const lectureAPI={
	attendance:(req, res, next)=>{
		const b=req.body;
		console.log(b);

		if(!(b.data && b.lectureId)){
			res.end();
		}

		const studentIds=b.data.map((d, i)=>{
			if(d._label!=='unknown' && d._distance < 0.5){
				return d._label;
			}
		});

		Student.find({
			studentId:{$in:studentIds}
		}, (err, students)=>{
			if(err) return next(err);
			if(!(students && students.length)){
				res.end();
			}

			Lecture.findById(b.lectureId, (err, lecture)=>{
				if(!(lecture && lecture._id)){
					res.end();
				}

				lecture.attendedStudents=students.map((s, i)=>s._id);

				lecture.save((err, updatedLecture)=>{
					res.json({
						status:'success',
						lecture:updatedLecture
					});
				});
			});
		});
	},
	getAttendedStudents:(req, res, next)=>{
		const {lectureId}=req.query;
		if(!lectureId){
			res.json({
				status:'error',
				message:'lack of data'
			});
		}

		Lecture.findById(lectureId).populate({
			path:'attendedStudents'
		}).exec((err, lecture)=>{
			if(!(lecture && lecture._id)){
				res.json({
					status:'error',
					message:'lecture not found'
				});
			}
			res.json({
				status:'success',
				students:lecture.attendedStudents,
				message:'if the list of attended students is empty, try to request again. because it takes some time to mark them attended'
			});
		});
	}
}

module.exports=lectureAPI;