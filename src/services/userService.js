const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");

// USERS
async function findUserByPhone(phone) {
  const r = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
  return r.rows[0];
}
async function createUser(phone, role) {
  const r = await pool.query(
    "INSERT INTO users (phone, role) VALUES ($1, $2) RETURNING *",
    [phone, role]
  );
  return r.rows[0];
}
async function updateUserProfile(userId, data) {
  const fields = [];
  const values = [];
  if (data.name !== undefined) { values.push(data.name); fields.push(`name = $${values.length}`); }
  if (data.email !== undefined) { values.push(data.email); fields.push(`email = $${values.length}`); }
  if (!fields.length) return;
  values.push(userId);
  await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${values.length}`, values);
}
async function getUserById(id) {
  const r = await pool.query("SELECT id, phone, name, email, created_at FROM users WHERE id = $1", [id]);
  return r.rows[0];
}

// admin
async function authenticateAdmin(username, password) {
  const result = await pool.query(
    "SELECT * FROM admin WHERE username = $1",
    [username]
  );

  if (result.rows.length === 0) {
    throw new Error("NOT_ADMIN");
  }

  const user = result.rows[0];

  if (user.password !== password) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return user
}

// OTP
async function upsertOtp(phone, code, ttlSec) {
  const expiresAt = new Date(Date.now() + Number(ttlSec) * 1000);
  await pool.query(
    `INSERT INTO otps (phone, code, expires_at)
     VALUES ($1, $2, $3)`,
    [phone, code, expiresAt]
  );
}
async function verifyAndConsumeOtp(phone, code) {
  const { rows } = await pool.query(
    `SELECT * FROM otps 
     WHERE phone = $1 AND consumed = false 
     ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );
  const row = rows[0];
  if (!row) return { ok: false, reason: "OTP not requested" };

  if (row.expires_at < new Date()) return { ok: false, reason: "OTP expired" };

  if (row.code !== code) {
    await pool.query("UPDATE otps SET attempts = attempts + 1 WHERE id = $1", [row.id]);
    if ((row.attempts + 1) >= Number(process.env.OTP_MAX_ATTEMPTS || 5)) {
      await pool.query("UPDATE otps SET consumed = true WHERE id = $1", [row.id]);
    }
    return { ok: false, reason: "Invalid OTP" };
  }

  await pool.query("UPDATE otps SET consumed = true WHERE id = $1", [row.id]);
  return { ok: true };
}

// REFRESH TOKENS
async function storeRefreshToken(userId, token, expiresAt) {
  const id = uuidv4();
  await pool.query(
    "INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)",
    [id, userId, token, expiresAt]
  );
}
async function revokeRefreshToken(token) {
  await pool.query("UPDATE refresh_tokens SET revoked = true WHERE token = $1", [token]);
}
async function isRefreshTokenActive(token) {
  const r = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()",
    [token]
  );
  return !!r.rows[0];
}

// ADDRESSES
async function addAddress(userId, payload) {
  if (payload.is_default) {
    await pool.query("UPDATE addresses SET is_default = false WHERE user_id = $1", [userId]);
  }
  const r = await pool.query(
    `INSERT INTO addresses (user_id, line1, line2, city, state, pincode, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [userId, payload.line1, payload.line2 || null, payload.city, payload.state, payload.pincode, !!payload.is_default]
  );
  return r.rows[0];
}

async function listAddresses(userId) {
  const r = await pool.query(
    "SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return r.rows;
}

async function updateAddress(userId, id, payload) {
  if (payload.is_default === true) {
    await pool.query("UPDATE addresses SET is_default = false WHERE user_id = $1", [userId]);
  }
  const fields = [];
  const values = [];
  for (const key of ["line1", "line2", "city", "state", "pincode", "is_default"]) {
    if (payload[key] !== undefined) {
      values.push(payload[key]);
      fields.push(`${key} = $${values.length}`);
    }
  }
  if (!fields.length) return;
  values.push(userId);
  values.push(id);
  await pool.query(
    `UPDATE addresses SET ${fields.join(", ")} WHERE user_id = $${values.length - 1} AND id = $${values.length}`,
    values
  );
}

async function deleteAddress(userId, id) {
  await pool.query("DELETE FROM addresses WHERE user_id = $1 AND id = $2", [userId, id]);
}

module.exports = {
  //admin
  authenticateAdmin,
  // user
  findUserByPhone, createUser, updateUserProfile, getUserById,
  // otp
  upsertOtp, verifyAndConsumeOtp,
  // refresh
  storeRefreshToken, revokeRefreshToken, isRefreshTokenActive,
  // addresses
  addAddress, listAddresses, updateAddress, deleteAddress
};
