const pool = require("../db");

exports.createFoodOrder = async (userId, { vendor_id, items, address_id, lat, lng, notes }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO orders (user_id, vendor_id, type, status, address_id, lat, lng, notes, amount, payment_intent)
       VALUES ($1,$2,'food','CREATED',$3,$4,$5,$6,0,'pi_temp')
       RETURNING id`,
      [userId, vendor_id, address_id, lat, lng, notes]
    );

    const orderId = result.rows[0].id;
    let total = 0;

    for (let item of items) {
      const price = 100; // TODO: fetch from vendor menu table
      total += price * item.qty;
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, qty, price) VALUES ($1,$2,$3,$4)`,
        [orderId, item.menu_item_id, item.qty, price]
      );
    }

    await client.query(
      `UPDATE orders SET amount=$1, status='PENDING_VENDOR_CONFIRMATION' WHERE id=$2`,
      [total, orderId]
    );

    await client.query("COMMIT");
    return { order_id: orderId, amount: total, payment_intent: "pi_temp" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.confirmPayment = async (orderId, payment_intent) => {
  const result = await pool.query(
    `UPDATE orders SET payment_intent=$1, status='ACCEPTED' WHERE id=$2 RETURNING *`,
    [payment_intent, orderId]
  );
  return result.rows[0];
};

exports.getOrderById = async (orderId, userId) => {
  const result = await pool.query(`SELECT * FROM orders WHERE id=$1 AND user_id=$2`, [orderId, userId]);
  if (result.rowCount === 0) throw new Error("Order not found");
  return result.rows[0];
};

exports.getOrders = async (userId, { type, status, mine }) => {
  let query = `SELECT * FROM orders WHERE 1=1`;
  const params = [];
  if (mine) {
    params.push(userId);
    query += ` AND user_id=$${params.length}`;
  }
  if (type) {
    params.push(type);
    query += ` AND type=$${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND status=$${params.length}`;
  }
  query += " ORDER BY created_at DESC";
  const result = await pool.query(query, params);
  return result.rows;
};

exports.updateOrderStatus = async (orderId, status) => {
  const query = `
    update orders set status=$1, updated_at=now()
    where id=$2 returning *
  `;
  const { rows } = await pool.query(query, [status, orderId]);
  return rows[0];
};

exports.createIntent = async (userId, type, { vendor_id, uploads, notes, address_id, lat, lng }) => {
  const result = await pool.query(
    `INSERT INTO orders (user_id, vendor_id, type, status, address_id, lat, lng, notes)
     VALUES ($1,$2,$3,'INTENT_CREATED',$4,$5,$6,$7) RETURNING id`,
    [userId, vendor_id, type, address_id, lat, lng, notes]
  );
  const orderId = result.rows[0].id;

  if (uploads && uploads.length) {
    for (let file of uploads) {
      await pool.query(
        `INSERT INTO order_uploads (order_id, file_url) VALUES ($1,$2)`,
        [orderId, file]
      );
    }
  }
  return { order_id: orderId, status: "INTENT_CREATED" };
};

// exports.getQuote = async (orderId, userId) => {
//   // placeholder: vendor sets quote
//   return { order_id: orderId, amount: 500, expires_in: 900 };
// };

// exports.confirmQuote = async (orderId, userId, payment_intent) => {
//   await pool.query(
//     `UPDATE orders SET payment_intent=$1, status='USER_CONFIRMED' WHERE id=$2 AND user_id=$3`,
//     [payment_intent, orderId, userId]
//   );
//   return { order_id: orderId, status: "USER_CONFIRMED" };
// };

// exports.rejectQuote = async (orderId, userId) => {
//   await pool.query(
//     `UPDATE orders SET status='QUOTE_REJECTED' WHERE id=$1 AND user_id=$2`,
//     [orderId, userId]
//   );
//   return { order_id: orderId, status: "QUOTE_REJECTED" };
// };
