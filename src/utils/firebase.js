// lib/firebase.js
const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps.length) return admin;

  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  let serviceAccount = null;

  // 1️⃣ Base64 decoded key (best method for servers & GitHub)
  if (base64Key) {
    try {
      const decoded = Buffer.from(base64Key, "base64").toString("utf8");
      serviceAccount = JSON.parse(decoded);
    } catch (err) {
      console.error("❌ Invalid FIREBASE_SERVICE_ACCOUNT_BASE64");
      throw err;
    }
  }

  // 2️⃣ Pure JSON string in env
  else if (jsonString) {
    try {
      serviceAccount = JSON.parse(jsonString);
    } catch (err) {
      console.error("❌ Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
      throw err;
    }
  }

  // 3️⃣ File path fallback
  else if (filePath) {
    try {
      serviceAccount = require(filePath);
    } catch (err) {
      console.error("❌ Cannot load service account JSON file");
      throw err;
    }
  }

  else {
    throw new Error(
      "Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH"
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
}

module.exports = initFirebase();
