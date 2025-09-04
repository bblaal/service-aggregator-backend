const pool = require("../config/db");

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

exports.fetchVendorsByArea = async (area) => {
  const { rows } = await pool.query("SELECT * FROM vendors WHERE service_area=$1", [area]);
  return rows;
};

exports.fetchVendorMenu = async (vendorId) => {
  const { rows } = await pool.query("SELECT * FROM vendor_menus WHERE vendor_id=$1", [vendorId]);
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

exports.updateVendorStatus = async (vendorId, is_open, prep_time) => {
  await pool.query(
    "UPDATE vendors SET is_open=$1, prep_time=$2 WHERE id=$3",
    [is_open, prep_time, vendorId]
  );
};

exports.updateMenuItemForVendor = async (id, is_available, price) => {
  await pool.query(
    "UPDATE vendor_menus SET is_available=$1, price=$2 WHERE id=$3",
    [is_available, price, id]
  );
};

exports.addMenuItemForVendor = async (vendorId, globalMenuId, description, price) => {
  await pool.query(
    "INSERT INTO vendor_menus (vendor_id, global_menu_id, description, price) VALUES ($1, $2, $3, $4)",
    [vendorId, globalMenuId, description, price]
  );
};

exports.addVendor = async (
  name,
  type,
  address,
  latitude,
  longitude,
  area,
  is_open,
  prep_time,
  service_radius,
  phone,
  image_url
) => {
  await pool.query(
    `INSERT INTO vendors 
    (name, type, address, latitude, longitude, is_open, prep_time, service_area, service_radius, phone, image_url) 
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [name, type, address, latitude, longitude, is_open, prep_time, area, service_radius, phone, image_url]
  );
};


exports.fetchGlobalMenuList = async () => {
  const { rows } = await pool.query("SELECT * FROM global_menu")
  return rows;
};