// lib/firebase.js
const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps && admin.apps.length) return admin;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH; // path to json
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON; // json string content

  let serviceAccount;
  if (serviceAccountJson) {
    serviceAccount = JSON.parse(serviceAccountJson);
  } else if (serviceAccountPath) {
    serviceAccount = require(serviceAccountPath);
  } else {
    throw new Error(
      "Firebase service account not provided. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH"
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
}

module.exports = initFirebase();
