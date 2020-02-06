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
				let attended = (lecture.attendedStudents.indexOf(student._id) != -1)
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
		const {studentId} = req.params;
		Student.findOne({studentId}, (err, student)=>{
			if(!(student && student._id)){
				return res.json({
					status: 'error',
					message: 'student not found'
				});
			}

			Section.find({groups: student.group}, 'number course').populate({
				path:'course',
				select:'title'
			}).exec((err, sections)=>{
				if(!(sections && sections.length)){
					return res.json({
						status: 'error',
						message: 'no sections found'
					});
				}

				let sectionIds=sections.map((s, i)=>s._id);
				Lecture.find({
					section: {$in: sectionIds}
				}, 'number students attendedStudents section created_at', (err, lectures)=>{
					if(!(lectures && lectures.length)){
						return res.json({
							status: 'error',
							message: 'no lectures found'
						});
					}

					sections = sections.map((s, i)=>{
						let lecturesOfSection = lectures.filter((l)=>{
							return l.section.toString() == s._id.toString();
						}).map((l, lIndex)=>{
							let d = new Date(l.created_at);
							return {
								number: l.number,
								attended: (l.attendedStudents.indexOf(student._id) == -1) ? 0 : 1,
								date: pad(d.getDay(), 2)+'.'+pad(d.getMonth()+1, 2)
							}
						});

						return {
							course: s.course,
							_id: s._id,
							number: s.number,
							lectures: lecturesOfSection
						};
					});

					res.json(sections);
				});
			});
		});
		//res.end();
	}
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

module.exports=studentAPI;