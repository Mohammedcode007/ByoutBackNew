// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./config/firebaseServiceAccount.json'); // المسار حسب مكان الملف

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
