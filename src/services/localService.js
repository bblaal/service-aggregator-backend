const pool = require("../config/db");


exports.addService = async (payload) => {
    const { name, category, description, address, phone, icon, area } = payload;
    await pool.query(
        `INSERT INTO services (category, name, phone, address, description, area, icon)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [category, name, phone, address, description, area, icon]
    );
};

exports.getServicesCategoryByArea = async (area) => {
  const result = await pool.query("SELECT DISTINCT category, icon, id FROM services WHERE area = $1", [area]);

  return result.rows
};

exports.getAllServicesByArea = async (area) => {
  const result = await pool.query("SELECT * FROM services WHERE area = $1", [area]);

  return result.rows
};

exports.getServicesByCategoryAndArea = async (area, category) => {
  const result = await pool.query("SELECT * FROM services WHERE area = $1 AND category = $2", [area, category]);

  return result.rows
};