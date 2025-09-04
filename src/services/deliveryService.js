const pool = require("../config/db");

exports.createAgent = async (name, age, address, mobile, blood_group,
  license_no,
  bike_no, area, imageUrl) => {
  const query = `
    insert into agents (name, image_url, age, address, mobile, blood_group, license_no, bike_no, service_area)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *
  `;
  const { rows } = await pool.query(query, [
    name,
    imageUrl,
    age,
    address,
    mobile,
    blood_group,
    license_no,
    bike_no,
    area,
  ]);
  return rows[0];
};

exports.fetchAllAgents = async (area) => {
  const { rows } = await pool.query("SELECT * FROM agents WHERE service_area=$1", [area]);
  return rows;
};

exports.createDelivery = async (orderId, agentId) => {
  const query = `
    insert into deliveries (order_id, agent_id, status)
    values ($1, $2, 'ASSIGNED')
    returning *
  `;
  const { rows } = await pool.query(query, [orderId, agentId]);
  return rows[0];
};

exports.updateDeliveryLocation = async (id, lat, lng) => {
  const query = `
    update deliveries set current_lat=$1, current_lng=$2, updated_at=now()
    where id=$3 returning *
  `;
  const { rows } = await pool.query(query, [lat, lng, id]);
  return rows[0];
};

exports.getDelivery = async (id) => {
  const query = `
    select d.*, a.name as agent_name, a.mobile, a.bike_no
    from deliveries d
    join agents a on d.agent_id = a.id
    where d.id=$1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};
