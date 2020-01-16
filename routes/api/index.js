var keystone=require('keystone');
var APIRouter=keystone.createRouter();

var teacherAPI=require('./teacher');
var studentAPI=require('./student');
const surveyAPI=require('./survey');

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

// survey api
APIRouter.post('/survey/start', surveyAPI.start);
APIRouter.get('/survey/find', surveyAPI.find);

module.exports=APIRouter;