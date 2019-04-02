// const path = require('path')
// const fs = require('fs')
// const fr = require('face-recognition');

// const dataPath = path.resolve('../../faces/students');

// module.exports=function(studentId,photo){
// 	const recognizer = fr.FaceRecognizer();
// 	const modelFile=dataPath+'/face_'+studentId+'.json';
// 	if(fs.existsSync(modelFile)){
// 		const modelState = require(dataPath+'/face_'+studentId+'.json');
// 		recognizer.load(modelState);
// 		const prediction = recognizer.predict(face);
// 		var data={
// 			status:'success',
// 			distance:prediction.distance
// 		}
// 		return data;
// 	}else{
// 		console.log('model file not found for '+studentId);
// 		return {
// 			status:'error',
// 			message:'model file not found'
// 		}
// 	}
// }


// //detect.js
// const image = fr.loadImage('image.png');
// const detector = fr.FaceDetector()
// const targetSize = 150
// const faceImages = detector.detectFaces(image, targetSize);
// faceImages.forEach((img, i) => fr.saveImage(`face_${i}.png`, img));

// //train.js


// trainDataByClass.forEach((faces, label) => {
//   const name = classNames[label]
//   recognizer.addFaces(faces, name)
// })

// //save.js
// const modelState = recognizer.serialize()
// fs.writeFileSync('model.json', JSON.stringify(modelState))


// //load.js


// //predict.js
// const errors = classNames.map(_ => [])
// testDataByClass.forEach((faces, label) => {
//   const name = classNames[label]
//   console.log()
//   console.log('testing %s', name)
//   faces.forEach((face, i) => {
//     const prediction = recognizer.predictBest(face)
//     console.log('%s (%s)', prediction.className, prediction.distance)

//     // count number of wrong classifications
//     if (prediction.className !== name) {
//       errors[label] = errors[label] + 1
//     }
//   })
// })

// // print the result
// const result = classNames.map((className, label) => {
//   const numTestFaces = testDataByClass[label].length
//   const numCorrect = numTestFaces - errors[label].length
//   const accuracy = parseInt((numCorrect / numTestFaces) * 10000) / 100
//   return `${className} ( ${accuracy}% ) : ${numCorrect} of ${numTestFaces} faces have been recognized correctly`
// })
// console.log('result:')
// console.log(result)
