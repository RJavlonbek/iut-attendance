const keystone=require('keystone');

const lectureAPI={
	attendance:(req, res, next)=>{
		const b=req.body;
		console.log(b);
		res.end();
	}
}

module.exports=lectureAPI;