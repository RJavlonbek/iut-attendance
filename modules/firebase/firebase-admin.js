
var admin = require("firebase-admin");

var serviceAccount = require("path/to/code-sys-firebaseKey.json");

const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://code-sys.firebaseio.com"
});

const sendNotificationOnAttendance = (token, attendanceStatus) => {
    console.log('sending notification');
    return new Promise((resolve, reject) => {
        if (!token) return reject(new Error('Registration token is not given'));

        switch (attendanceStatus / 1) {
            case 0:
                attendanceStatus = "Not attended";
                break;
            case 1:
                attendanceStatus = "Attended";
                break;
            default:
                attendanceStatus = ''
        }
        if (!attendanceStatus) return reject(new Error("Unknown attendance status"));

        const message = {
            notification: {
                title: 'Code Sys',
                body: 'Attendance status: ' + attendanceStatus,
                sound: 'default'
            }
        };

        admin.messaging().sendToDevice(token, message, notification_options).then((response) => {
            return resolve(response);
        }).catch((err) => {
            return reject(err);
        });
    });
}

module.exports = firebaseAdmin = admin;
module.exports.sendNotificationOnAttendance = sendNotificationOnAttendance;
module.exports.notificationOptions = notification_options;