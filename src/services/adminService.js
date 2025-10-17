const pool = require("../config/db");
const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

exports.addGlobalMenuItem = async (menuName, category, imageUrl) => {
  await pool.query(
    "INSERT INTO global_menu (name, category, imageurl) VALUES ($1, $2, $3)",
    [menuName, category, imageUrl]
  );
};

exports.addNewServiceAreaPincode = async (pincode, area) => {
    await pool.query(
      "INSERT INTO service_area (pincode, area) VALUES ($1, $2)",
      [pincode, area]
    );
  };

  exports.fetchServiceArea = async () => {
    const result = await pool.query("SELECT * FROM service_area");
  
    // Extract only area as an array of strings
    // return result.rows.map(row => row.area);

    return result.rows
  };

exports.checkServiceArea = async (lat, lng) => {
  // 1. Reverse geocode
  const geoRes = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
  );

  if (!geoRes.data.results.length) {
    throw new Error("No address found for location");
  }

  const address = geoRes.data.results[0].formatted_address;


  // Try to extract locality/area
  const components = geoRes.data.results[0].address_components;

  let area = null;
  for (let comp of components) {
    if (comp.types.includes("locality") || comp.types.includes("sublocality")) {
      area = comp.long_name;
      break;
    }
  }

  if (!area) {
    area = address; // fallback
  }

  // 2. Fetch all service areas from DB
  const result = await pool.query("SELECT area FROM service_area");
  const serviceableAreas = result.rows.map(row => row.area);

  // 3. Check if this area is serviceable
  const serviceable = serviceableAreas.some(sa =>
    area.toLowerCase().includes(sa.toLowerCase())
  );

  return { serviceable, area, address };
};

exports.approveVendor = async (id,
  phone,
  service_radius,
  status,) => {

  if (!id) {
    throw new Error("Vendor ID is required");
  }

  const query = `
    UPDATE vendors
    SET service_radius=$1, status=$2
    WHERE id = $3 AND phone = $4;
  `;

  const { rows } = await pool.query(query, [service_radius, status, id, phone]);
  return rows[0]; // return updated vendor

};

  
