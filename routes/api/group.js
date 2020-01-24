const keystone=require('keystone');

const Group=keystone.list('Group').model;

const groupAPI={
	findGroups:(req, res, next)=>{
		Group.find({}, 'title', (err, groups)=>{
			if(err) return next(err);
			res.json(groups);
		})
	}
}

module.exports=groupAPI;