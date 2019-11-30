var keystone=require('keystone');
var APIRouter=keystone.createRouter();

var teacherAPI=require('./teacher');
var studentAPI=require('./student');


APIRouter.get('/',function(req,res,next){
	res.send('hello world');
});

//teacher api
APIRouter.get('/teacher/:teacherId/attendance',teacherAPI.startAttendance);
APIRouter.post('/teacher/login',teacherAPI.login);

//student api
APIRouter.post('/student/:studentId/attendance',studentAPI.checkAttendance);

module.exports=APIRouter;