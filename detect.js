const image = fr.loadImage('image.png');
const detector = fr.FaceDetector()
const targetSize = 150
const faceImages = detector.detectFaces(image, targetSize);
faceImages.forEach((img, i) => fr.saveImage(`face_${i}.png`, img));