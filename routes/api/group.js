const keystone=require('keystone');

const Group=keystone.list('Group').model;
const Section=keystone.list('Section').model;

const groupAPI={
	findGroups:(req, res, next)=>{
		let query={};
		if(req.query.teacherId){
			query={
				...query,
				teacher:req.query.teacherId
			}

			Section.find(query, 'groups').populate({
				path:'groups',
				select:'title'
			}).exec((err, sections)=>{
				if(!(sections && sections.length)){
					return res.json([]);
				}

				let groups=[];
				sections.map((sec, i)=>{
					sec.groups.map((gr, gr_i)=>{
						let exist=false;
						groups.map((g, g_i)=>{
							if(g._id == gr._id){
								exist=true;
							}
						});

						if(!exist){
							groups.push(gr);
						}
					});
				});
				return res.json(groups);
			});
		}else{
			Group.find({}, 'title', (err, groups)=>{
				if(err) return next(err);
				res.json(groups);
			});
		}
	}
}

module.exports=groupAPI;