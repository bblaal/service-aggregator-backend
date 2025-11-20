const pool = require("../config/db");
const userService = require("./userService");

exports.fetchVendors = async (type, lat, lng, radius) => {
  let query = "SELECT * FROM vendors";
  const conditions = [];
  const values = [];

  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (lat && lng && radius) {
    values.push(lat, lng, radius);
    conditions.push(`earth_box(ll_to_earth($1, $2), $3) @> ll_to_earth(lat, lng)`);
  }
  if (conditions.length) query += " WHERE " + conditions.join(" AND ");

  const { rows } = await pool.query(query, values);
  return rows;
};

exports.fetchVendorById = async (id) => {
  const { rows } = await pool.query("SELECT * FROM vendors WHERE id=$1", [id]);
  return rows[0];
};

exports.fetchVendorByPhone = async (phone) => {
  const { rows } = await pool.query("SELECT * FROM vendors WHERE phone=$1", [phone]);
  return rows[0];
};

exports.fetchVendorsByArea = async (area, status) => {
  const { rows } = await pool.query("SELECT * FROM vendors WHERE area=$1 AND status=$2", [area, status]);
  return rows;
};

exports.fetchVendorMenu = async (vendorId) => {
  const { rows } = await pool.query(
    "SELECT vm.id AS item_id, vm.vendor_id, vm.description, vm.selling_price, vm.vendor_price, vm.availability, gm.name, gm.imageUrl, gm.category FROM vendor_menu vm JOIN global_menu gm ON vm.global_menu_id = gm.id WHERE vm.vendor_id = $1;", [vendorId]);
  return rows;
};

exports.fetchServices = async (category, city) => {
  let query = "SELECT * FROM services";
  const conditions = [];
  const values = [];

  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }
  if (city) {
    values.push(city);
    conditions.push(`city = $${values.length}`);
  }
  if (conditions.length) query += " WHERE " + conditions.join(" AND ");

  const { rows } = await pool.query(query, values);
  return rows;
};

// services/vendorService.js
exports.updateVendorStatus = async (
  id,
  name,
  phone,
  service_radius,
  is_open,
  prep_time,
  image_url
) => {
  await pool.query(
    `UPDATE vendors
     SET 
       name = $1,
       phone = $2,
       service_radius = $3,
       is_open = $4,
       prep_time = $5,
       image_url = $6
     WHERE id = $7`,
    [name, phone, service_radius, is_open, prep_time, image_url, id]
  );
};

exports.updateVendor = async (userId, updateData) => {
  if (!userId) {
    throw new Error("Vendor ID is required");
  }

  const fields = Object.keys(updateData);
  const values = Object.values(updateData);

  if (fields.length === 0) {
    throw new Error("No fields provided for update");
  }

  // Build dynamic SET clause like: "phone = $1, service_radius = $2 ..."
  const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(", ");

  const query = `
    UPDATE vendors
    SET ${setClause}
    WHERE user_id = $${fields.length + 1};
  `;

  const { rows } = await pool.query(query, [...values, userId]);
  return rows[0]; // return updated vendor

};



exports.toggleAvailability = async (id, availability) => {
  await pool.query(
    "UPDATE vendor_menu SET availability=$1 WHERE id=$2",
    [availability, id]
  );
};

exports.updateMenuItemForVendor = async (id, availability, description, sellingPrice, vendorPrice) => {
  await pool.query(
    "UPDATE vendor_menu SET availability=$1, description=$2, selling_price=$3, vendor_price=$4 WHERE id=$5",
    [availability, description, sellingPrice, vendorPrice, id]
  );
};

exports.addMenuItemForVendor = async (vendorId, globalMenuId, description, sellingPrice, vendorPrice) => {
  await pool.query(
    "INSERT INTO vendor_menu (vendor_id, global_menu_id, description, selling_price, vendor_price, availability) VALUES ($1, $2, $3, $4, $5, $6)",
    [vendorId, globalMenuId, description, sellingPrice, vendorPrice, true]
  );
};

exports.deleteMenuItemForVendor = async (menuId, vendorId) => {
  await pool.query(
    "DELETE FROM vendor_menu WHERE id = $1 AND vendor_id = $2",
    [menuId, vendorId]
  );
};


// services/vendorService.js
exports.addVendor = async (body) => {
  const {
    phone,
    type,
    area,
    name,
    address,
    latitude = null,
    longitude = null,
    fssai_lic = null,
    prep_time = 0,
    service_radius = 0,
    image_url = null,
  } = body;

  const user = await userService.findUserByPhone(phone);
  if (!user) {
    throw new Error(`User with phone ${phone} not found`);
  }

  const result = await pool.query(
    `INSERT INTO vendors 
      (user_id, phone, type, area, name, address, latitude, longitude, prep_time, service_radius, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      user.id,
      phone,
      type,
      area,
      name,
      address,
      latitude,
      longitude,
      prep_time,
      service_radius,
      image_url,
    ]
  );

  // const updateVendorRole = userService.updateUserRoleAsVendor(user.id, phone, "VENDOR")

  return result.rows[0]; // ✅ return inserted vendor
};


exports.fetchGlobalMenuList = async () => {
  const { rows } = await pool.query("SELECT * FROM global_menu")
  return rows;
};

exports.registerToken = async (vendorId, fcmToken, platform) => {
  try {
    if (!vendorId || !fcmToken) {
      return res.status(400).json({ error: "vendorId and fcmToken required" });
    }

    // Upsert to vendor_devices
    const sql = `
      INSERT INTO vendor_devices (vendor_id, fcm_token, platform, last_seen)
      VALUES ($1, $2, $3, now())
      ON CONFLICT (vendor_id, fcm_token)
      DO UPDATE SET last_seen = now(), platform = EXCLUDED.platform
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [vendorId, fcmToken, platform || null]);
    return ({ success: true, device: rows[0] });
  } catch (err) {
    console.error("registerToken error:", err);
    return ({ success: false, error: err.message });
  }
};