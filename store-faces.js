var keystone=require('keystone');
var fr=require('face-recognition');
const path = require('path');
const fs = require('fs');

const recognizer = fr.FaceRecognizer();
const photosPath=path.resolve('./public/uploads/students');
const modelsPath=path.resolve('./faces/students');

var Student=keystone.list('Student').model;

console.log('...storing faces');
Student.find({},function(err,students){
	if(err) return next(err);
	if(students && students.length){
		console.log(students.length+' students found');
		for(var i=0; i<students.length;i++){
			var student=students[i];
			if(fs.existsSync(modelsPath+'/face_'+student.studentId+'.json')){
				// data already exist, skipping...
			}else{
				if(fs.existsSync(photosPath+'/'+student.photo.filename)){
					const photo = fr.loadImage('image.png');
					//training
					recognizer.addFaces([photo], student.studentId);
					//save.js
					const modelState = recognizer.serialize();
					fs.writeFileSync('face_'+student.studentId+'.json', JSON.stringify(modelState));
				}else{
					console.log(student.studentId+' has no photo');
				}
			}
		}
	}else{
		console.log('No students found...');
	}
});