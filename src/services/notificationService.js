// services/notificationService.js
const admin = require("../utils/firebase");
const { Pool } = require("pg");

// Configure this to match your DB connection (or import your existing pool)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // set this
  // add ssl, etc. depending on env
});

/**
 * Fetch tokens for a vendor
 * @param {number} vendorId
 * @returns {Promise<string[]>} array of fcm tokens
 */
async function getVendorTokens(vendorId) {
  const sql = `SELECT id, fcm_token FROM vendor_devices WHERE vendor_id = $1`;
  const { rows } = await pool.query(sql, [vendorId]);
  return rows; // [{id, fcm_token}, ...]
}

/**
 * Remove device token by id
 * @param {number} id
 */
async function deleteDeviceById(id) {
  await pool.query(`DELETE FROM vendor_devices WHERE id = $1`, [id]);
}

/**
 * Send notification to vendor (all devices)
 * @param {number} vendorId
 * @param {number|string} orderId
 * @returns {Promise<void>}
 */
async function sendVendorNotification(vendorId, orderId) {
  if (!vendorId) throw new Error("vendorId required");

  const devices = await getVendorTokens(vendorId);
  if (!devices || devices.length === 0) return;

  const tokens = devices.map((d) => d.fcm_token);

  const title = "New Order Received";
  const body = `You have a new order (#${orderId}). Tap to view.`;

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      type: "NEW_ORDER",
      orderId: String(orderId),
      vendorId: String(vendorId),
    },
  };

  try {
    const BATCH_SIZE = 450;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const chunk = tokens.slice(i, i + BATCH_SIZE);

      const response = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: message.notification,
        data: message.data,
      });

      // Handle invalid tokens
      response.responses.forEach(async (resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code || "";
          const token = chunk[idx];

          if (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/invalid-argument"
          ) {
            const deviceRow = devices.find((d) => d.fcm_token === token);
            if (deviceRow) {
              await deleteDeviceById(deviceRow.id);
              console.log("Removed invalid token:", token);
            }
          } else {
            console.warn("FCM send error:", errorCode);
          }
        }
      });
    }
  } catch (err) {
    console.error("Error sending vendor notification:", err);
    throw err;
  }
}

module.exports = {
  sendVendorNotification,
};
