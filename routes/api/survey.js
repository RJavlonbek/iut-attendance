const keystone=require('keystone');
const async=require('async');
const ObjectId=require('mongodb').ObjectID;

const Survey=keystone.list('Survey').model;
const Teacher=keystone.list('Teacher').model;
const Student=keystone.list('Student').model;

const surveyAPI={
	start:function(req, res, next){
		let b=req.body;
		let survey={};
		if(b.title && b.content && b.author){
			async.parallel({
				student:(cb)=>{
					Student.findById(ObjectId(b.author), cb);
				},
				teacher:(cb)=>{
					Teacher.findById(ObjectId(b.author), cb);
				}
			}, (err, results)=>{
				if(err) return next(err);
				if(results.student){ 
					survey.student=results.student._id; 
				}else if(results.teacher){
					survey.teacher=results.teacher._id;
				}else{
					res.json({
						status:'error',
						message:'invalid author id is given'
					});
				}

				survey.title=b.title;
				survey.content=b.content;
				survey=new Survey(survey);

				survey.save((err, s)=>{
					if(err) return next(err);
					res.json({
						status:'success',
						message:'survey is created',
						survey:s
					});
				});
			});
		}else{
			res.json({
				status:'error',
				message:'given data is not enough'
			});
		}
	},
	find:(req, res, next)=>{
		Survey.find({}).populate({
			path:'teacher',
			select:['teacherId', 'firstname', 'lastname']
		}).populate({
			path:'student',
			select:['studentId', 'firstname', 'lastname']
		}).populate({
			path:'votedUp',
			select:['studentId', 'firstname', 'lastname']
		}).populate({
			path:'votedDown',
			select:['studentId', 'firstname', 'lastname']
		}).exec((err, surveys)=>{
			if(err) return next(err);
			res.json(surveys);
		});
	},
	vote:(req, res, next)=>{
		const {surveyId, studentId, vote} = req.body || {};
		if(!(surveyId && studentId && vote)){
			return res.json({
				status:'error',
				message:'lack of data'
			});
		}

		let update={}
		if(vote=='up'){
			update={
				$pull:{votedDown:studentId},
				$addToSet:{votedUp:studentId}
			}
		}else if(vote=='down'){
			update={
				$pull:{votedUp:studentId},
				$addToSet:{votedDown:studentId}
			}
		}else{
			return res.json({
				status:'error',
				message:'invalid vote action'
			});
		}
		
		Survey.findByIdAndUpdate(surveyId, update, (err, survey)=>{
			//if(err) return next();
			if(!(survey && survey._id)){
				return res.json({
					status:'error',
					message:'survey not found'
				});
			}

			res.json({
				status:'success',
				message:'done'
			});
		});
	}
}

module.exports=surveyAPI;