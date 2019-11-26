var keystone=require('keystone');
var APIRouter=keystone.createRouter();

var teacherAPI=require('./teacher');
var studentAPI=require('./student');

var runDetectFaces=require('../../modules/face-api/app.js');

APIRouter.get('/',function(req,res,next){
	res.send('hello world');
});

//teacher api
APIRouter.get('/teacher/:teacherId/attendance',teacherAPI.startAttendance);
APIRouter.post('/teacher/login',teacherAPI.login);

//student api
APIRouter.post('/student/:studentId/attendance',studentAPI.checkAttendance);

APIRouter.get('/faces',(req,res,next)=>{
	res.send(runDetectFaces());
});

module.exports=APIRouter;