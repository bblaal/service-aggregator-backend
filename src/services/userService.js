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

async function updateUserRoleAsVendor(id, phone, role) {
  const r = await pool.query(
    "UPDATE users SET role = $1 WHERE id = $2 AND phone = $3",
    [role, id, phone]
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
  const r = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return r.rows[0];
}


// ADDRESSES
async function addAddress(userId, payload) {
  // if (payload.is_default) {
  //   await pool.query("UPDATE addresses SET is_default = false WHERE user_id = $1", [userId]);
  // }
  const r = await pool.query(
    `INSERT INTO addresses (user_id, line1, line2, city, state, pincode, is_default, area)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [userId, payload.line1, payload.line2 || null, payload.city, payload.state, payload.pincode, false, payload.area]
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

async function listAreaAddresses(userId, area) {
  const r = await pool.query(
    "SELECT * FROM addresses WHERE user_id = $1 AND area = $2 ORDER BY created_at DESC",
    [userId, area]
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
  // user
  findUserByPhone, createUser, updateUserProfile, getUserById, updateUserRoleAsVendor,
  // addresses
  addAddress, listAddresses, listAreaAddresses, updateAddress, deleteAddress
};
