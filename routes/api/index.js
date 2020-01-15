var keystone=require('keystone');
var APIRouter=keystone.createRouter();

var teacherAPI=require('./teacher');
var studentAPI=require('./student');


APIRouter.get('/',function(req,res,next){
	res.send('hello world');
});

//teacher api
APIRouter.get('/teacher/:teacherId/attendance',teacherAPI.startAttendance);
APIRouter.get('/teacher/:teacherId/timetable', teacherAPI.getTimetable);
APIRouter.post('/teacher/login',teacherAPI.login);
APIRouter.post('/teacher/file-upload', teacherAPI.fileUpload);

//student api
APIRouter.post('/student/:studentId/attendance',studentAPI.checkAttendance);

module.exports=APIRouter;