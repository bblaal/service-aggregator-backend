const pool = require("../config/db");
const userService = require("./userService");

exports.fetchAgents = async (type, lat, lng, radius) => {
    let query = "SELECT * FROM agents";
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

exports.fetchAgentByPhone = async (phone) => {
    const { rows } = await pool.query("SELECT * FROM agents WHERE phone=$1", [phone]);
    return rows[0];
};

exports.fetchVendorsByArea = async (area, status) => {
    const { rows } = await pool.query("SELECT * FROM vendors WHERE area=$1 AND status=$2", [area, status]);
    return rows;
};

exports.fetchVendorMenu = async (vendorId) => {
    const { rows } = await pool.query("SELECT vm.*, gm.name, gm.imageurl FROM vendor_menu vm JOIN global_menu gm ON vm.global_menu_id = gm.id WHERE vm.vendor_id = $1;", [vendorId]);
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

exports.addMenuItemForVendor = async (vendorId, globalMenuId, category, description, sellingPrice, vendorPrice) => {
    await pool.query(
        "INSERT INTO vendor_menu (vendor_id, global_menu_id, category, description, selling_price, vendor_price, availability) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [vendorId, globalMenuId, category, description, sellingPrice, vendorPrice, true]
    );
};

// services/vendorService.js
exports.addAgent = async (body) => {
    const {
      phone,
      area,
      name,
      address,
      dob, // DD/MM/YYYY from frontend
      driving_license,
      bike_no,
      blood_group,
      image_url = null,
    } = body;
  
    // Validate required fields
    if (!phone || !area || !name || !address || !dob) {
      throw new Error("Missing required fields");
    }
  
    // Convert DD/MM/YYYY → YYYY-MM-DD
    const dobParts = dob.split("/");
    if (dobParts.length !== 3) {
      throw new Error("Invalid date of birth format. Use DD/MM/YYYY");
    }
    const [day, month, year] = dobParts.map(Number);
    const formattedDob = `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  
    // Check if user exists
    const user = await userService.findUserByPhone(phone);
    if (!user) {
      throw new Error(`User with phone ${phone} not found, login with otp`);
    }
  
    const result = await pool.query(
      `INSERT INTO agents 
        (user_id, phone, area, name, address, dob, driving_license, bike_no, blood_group, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        user.id,
        phone,
        area,
        name,
        address,
        formattedDob, // ✅ pass in proper SQL date format
        driving_license,
        bike_no,
        blood_group,
        image_url,
      ]
    );
  
    return result.rows[0]; // return inserted agent
  };
  


exports.fetchGlobalMenuList = async () => {
    const { rows } = await pool.query("SELECT * FROM global_menu")
    return rows;
};


exports.savePushToken = async (vendorId, token) => {
    const query = `
    INSERT INTO vendor_push_tokens (vendor_id, token, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (vendor_id)
    DO UPDATE SET token = EXCLUDED.token, updated_at = NOW();
  `;

    await pool.query(query, [vendorId, token]);
};
