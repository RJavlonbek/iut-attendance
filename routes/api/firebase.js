const path = require('path');
const { firebaseAdmin } = require('../../modules/firebase/firebase-admin');
const Lecture = require('../../models/Lecture');

const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
};

var msg = firebaseAdmin.messaging();

const lectureAPI = {
    sendNotification: (req, res, next) => {
        const token = req.body.token
        const message = {
            notification: {
                title: 'Code Sys',
                body: req.body.message,
                sound: 'default'
            }
        };
        const options = notification_options

        msg.sendToDevice(token, message, options).then(response => {

            return res.json({
                result: 'success',
                response
            });

        }).catch(error => {
            console.log(error);
        });
    }
}

module.exports = lectureAPI;