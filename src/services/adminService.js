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
  // 1️⃣ Reverse Geocode using Google Maps API
  const geoRes = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
  );


  if (!geoRes.data.results?.length) {
    throw new Error("No address found for this location");
  }

  const firstResult = geoRes.data.results[0];
  const address = firstResult.formatted_address;
  const components = firstResult.address_components;

  let locality = null;
  let sublocality = null;
  let postalCode = null;

  // 2️⃣ Extract relevant fields
  for (let comp of components) {
    if (comp.types.includes("locality")) locality = comp.long_name;
    if (comp.types.includes("sublocality") || comp.types.includes("sublocality_level_1"))
      sublocality = comp.long_name;
    if (comp.types.includes("postal_code")) postalCode = comp.long_name;
  }

  // 3️⃣ Build area search strings
  const areaCandidates = [sublocality, locality].filter(Boolean);

  // 4️⃣ Fetch all service areas from DB
  const result = await pool.query("SELECT area, pincode FROM service_area");
  const serviceAreas = result.rows;

  // 5️⃣ Check serviceability
  let matchedArea = null;
  let serviceable = false;

  for (const sa of serviceAreas) {
    const areaName = sa.area?.toLowerCase() || "";
    const pincode = sa.pincode?.toString() || "";

    // Match area name with locality/sublocality
    const areaMatch = areaCandidates.some((a) =>
      a.toLowerCase().includes(areaName)
    );

    // Match postal code
    const pinMatch = postalCode && postalCode.toString() === pincode;

    if (areaMatch || pinMatch) {
      serviceable = true;
      matchedArea = sa.area || locality || sublocality;
      break;
    }
  }

  console.log(`Serviceability check: ${serviceable ? "Serviceable" : "Not Serviceable"} - Matched Area: ${matchedArea}`);
  return {
    serviceable,
    matchedArea: matchedArea || locality || sublocality,
    postalCode,
    address,
  };
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


