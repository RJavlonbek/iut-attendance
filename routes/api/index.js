var keystone=require('keystone');
var APIRouter=keystone.createRouter();

var teacherAPI=require('./teacher');
var studentAPI=require('./student');
const surveyAPI=require('./survey');
const lectureAPI=require('./lecture');
const groupAPI=require('./group');

APIRouter.get('/',function(req,res,next){
	res.send('hello world');
});

//teacher api
APIRouter.get('/teacher/:teacherId/attendance',teacherAPI.startAttendance);
APIRouter.get('/teacher/:teacherId/timetable', teacherAPI.getTimetable);
APIRouter.post('/teacher/login',teacherAPI.login);
APIRouter.post('/teacher/:teacherId/file-upload', teacherAPI.fileUpload);
APIRouter.get('/teacher/:teacherId/files', teacherAPI.findFiles);
APIRouter.get('/teacher/:teacherId/courses', teacherAPI.findCourses);
APIRouter.get('/teacher/:teacherId/sections', teacherAPI.findSections);

//student api
APIRouter.post('/student/:studentId/attendance',studentAPI.checkAttendance);
APIRouter.get('/student/find', studentAPI.findStudents);

// lecture && attendance
APIRouter.post('/lecture/attendance', lectureAPI.attendance);
APIRouter.get('/lecture/students', lectureAPI.getAttendedStudents);

// group
APIRouter.get('/group/find', groupAPI.findGroups);

// survey api
APIRouter.post('/survey/start', surveyAPI.start);
APIRouter.get('/survey/find', surveyAPI.find);
APIRouter.post('/survey/vote', surveyAPI.vote);

module.exports=APIRouter;