const canvas=require('canvas');
const faceapi=require('face-api.js');
const fs = require("fs")  
const path = require("path")

const { Canvas, Image, ImageData } = canvas  
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const faceDetectionNet = faceapi.nets.ssdMobilenetv1

// SsdMobilenetv1Options
const minConfidence = 0.5

// TinyFaceDetectorOptions
const inputSize = 408  
const scoreThreshold = 0.5

// MtcnnOptions
const minFaceSize = 50  
const scaleFactor = 0.8

function getFaceDetectorOptions(net) {  
    return net === faceapi.nets.ssdMobilenetv1
        ? new faceapi.SsdMobilenetv1Options({ minConfidence })
        : (net === faceapi.nets.tinyFaceDetector
            ? new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
            : new faceapi.MtcnnOptions({ minFaceSize, scaleFactor })
        )
}

const faceDetectionOptions = getFaceDetectorOptions(faceDetectionNet)

// simple utils to save files
const baseDir = path.resolve(__dirname, './out')  
function saveFile(fileName, buf) {  
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir)
    }
    // this is ok for prototyping but using sync methods
    // is bad practice in NodeJS
    fs.writeFileSync(path.resolve(baseDir, fileName), buf)
  }

async function run() {
    console.log('runningg');

    // load weights
    await faceDetectionNet.loadFromDisk('./weights')
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./weights')

    // load the image
    const img = await canvas.loadImage('./images/bbt2.jpg')

    // detect the faces with landmarks
    const results = await faceapi.detectAllFaces(img, faceDetectionOptions)
        .withFaceLandmarks()

    //console.log(results);
    // create a new canvas and draw the detection and landmarks
    const out = faceapi.createCanvasFromMedia(img);
    faceapi.draw.drawDetections(out, results.map(res => res.detection));
    faceapi.draw.drawFaceLandmarks(out, results.map(res => res.landmarks), { drawLines: true, color: 'red' });

    // save the new canvas as image
    saveFile('faceLandmarkDetection.jpg', out.toBuffer('image/jpeg'));
    console.log('done, saved results to out/faceLandmarkDetection.jpg');

    return results;
}

module.exports=run;

console.log('done');