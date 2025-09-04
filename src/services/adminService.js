const pool = require("../config/db");

exports.addGlobalMenuItem = async (menuName, imageUrl) => {
  console.log(imageUrl)
  await pool.query(
    "INSERT INTO global_menu (name, imageurl) VALUES ($1, $2)",
    [menuName, imageUrl]
  );
};

exports.addNewServiceAreaPincode = async (pincode, area) => {
    await pool.query(
      "INSERT INTO service_area (pincode, area) VALUES ($1, $2)",
      [pincode, area]
    );
  };

  exports.fetchServiceArea = async () => {
    const result = await pool.query("SELECT area FROM service_area");
  
    // Extract only pincodes as an array of strings
    return result.rows.map(row => row.area);
  };
  
