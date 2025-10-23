const pool = require("../config/db");


// exports.addNewServiceAreaPincode = async (pincode, area) => {
//   await pool.query(
//     "INSERT INTO service_area (pincode, area) VALUES ($1, $2)",
//     [pincode, area]
//   );
// };

exports.getServicesByArea = async (area) => {
  const result = await pool.query("SELECT DISTINCT category, icon, id FROM services WHERE area = $1", [area]);

  return result.rows
};

exports.getServicesByCategoryAndArea = async (area, category) => {
  const result = await pool.query("SELECT * FROM services WHERE area = $1 AND category = $2", [area, category]);

  return result.rows
};