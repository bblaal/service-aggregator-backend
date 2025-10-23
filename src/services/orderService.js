const pool = require("../config/db");

exports.createFoodOrder = async (
  userId,
  { vendor_id, order_type, items, address_id, lat, lng, notes }
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Step 1: Insert into orders
    const orderRes = await client.query(
      `INSERT INTO orders 
       (user_id, vendor_id, order_type, total_selling_amount, total_vendor_amount, total_platform_fee, address_id, lat, long, notes)
       VALUES ($1, $2, $3, 0, 0, 0, $4, $5, $6, $7)
       RETURNING id`,
      [userId, vendor_id, order_type, address_id, lat, lng, notes]
    );

    const orderId = orderRes.rows[0].id;

    // Step 2: Initialize totals
    let totalSelling = 0;
    let totalVendor = 0;

    // Step 3: Insert items
    for (let item of items) {
      // const totalSellingPrice =
      //   Number(item.unit_selling_price) * Number(item.quantity);
      // const totalVendorPrice =
      //   Number(item.unit_vendor_price) * Number(item.quantity);

      totalSelling += Number(item.unit_selling_price) * Number(item.quantity);
      totalVendor += Number(item.unit_vendor_price) * Number(item.quantity);

      // Optional: fetch item name from global_menu
      // const itemRes = await client.query(
      //   `SELECT item_name FROM global_menu WHERE id = $1`,
      //   [item.global_menu_id]
      // );
      // const itemName = itemRes.rows[0]?.item_name || "Unknown Item";

      await client.query(
        `INSERT INTO order_items 
         (order_id, menu_item_id, quantity, unit_selling_price, unit_vendor_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          orderId,
          item.menu_item_id,
          // itemName,
          item.quantity,
          item.unit_selling_price,
          item.unit_vendor_price,
          // totalSellingPrice,
          // totalVendorPrice,
        ]
      );
    }

    // Step 4: Update totals in order
    await client.query(
      `UPDATE orders 
       SET total_selling_amount = $1, total_vendor_amount = $2, total_platform_fee = $3
       WHERE id = $4`,
      [totalSelling, totalVendor, (totalSelling - totalVendor), orderId]
    );

    // ✅ Fetch vendor push token
    const vendorRes = await client.query(`SELECT token FROM vendor_push_tokens WHERE vendor_id=$1`, [vendor_id]);
    const pushToken = vendorRes.rows[0]?.push_token;

    if (pushToken) {
      await notificationService.sendPushNotification(
        pushToken,
        "New Order Received 🚀",
        `Order #${orderId} | Amount: ₹${totalVendor}`,
        { orderId }
      );
    }

    await client.query("COMMIT");

    return {
      order_id: orderId,
      total_selling_amount: totalSelling,
      total_vendor_amount: totalVendor,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Order creation failed:", err.message);
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

exports.getOrdersByVendor = async (vendorId) => {
  const result = await pool.query(
    `SELECT 
    o.id AS order_id,
    o.order_type,
    o.order_status,
    o.vendor_paid_status,
    o.total_selling_amount,
    o.total_vendor_amount,
    o.total_platform_fee,
    o.payment_mode,
    o.created_at AS order_datetime,
    json_agg(
        json_build_object(
            'item_name', gm.name,
            'quantity', oi.quantity,
            'unit_selling_price', oi.unit_selling_price,
            'unit_vendor_price', oi.unit_vendor_price,
            'total_selling_price', oi.total_selling_price,
            'total_vendor_price', oi.total_vendor_price
        ) ORDER BY oi.id
    ) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN vendor_menu vm ON vm.id = oi.menu_item_id
JOIN global_menu gm ON gm.id = vm.global_menu_id
WHERE o.vendor_id = $1
GROUP BY o.id
ORDER BY o.created_at DESC;
`,
    [vendorId]
  );
  if (result.rowCount === 0) throw new Error("Orders not found");
  return result.rows;
};

exports.getOrdersByUser = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT 
    o.id AS order_id,
    o.order_type,
    o.order_status,
    o.total_selling_amount,
    o.payment_mode,
    o.created_at AS order_datetime,
    json_agg(
        json_build_object(
            'item_name', gm.name,
            'quantity', oi.quantity,
            'unit_selling_price', oi.unit_selling_price,
            'total_selling_price', oi.total_selling_price
        ) ORDER BY oi.id
    ) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN vendor_menu vm ON vm.id = oi.menu_item_id
JOIN global_menu gm ON gm.id = vm.global_menu_id
WHERE o.user_id = $1
GROUP BY o.id
ORDER BY o.created_at DESC;
`,
      [userId]
    );
    if (result.rowCount === 0) throw new Error("Orders not found");
    return result.rows;
  } catch (err) {
    console.error("Error fetching orders by user:", err);
    throw err;
  }
};


exports.getAllPendingOrders = async (orderStatus) => {
  try {
    console.log("Fetching all pending orders with status:", orderStatus);
    const result = await pool.query(
      `SELECT 
    o.id AS order_id,
    o.order_type,
    o.order_status,
    o.vendor_paid_status,
    o.total_selling_amount,
    o.payment_mode,
    o.created_at AS order_datetime,
    json_agg(
        json_build_object(
            'item_name', gm.name,
            'quantity', oi.quantity
        ) ORDER BY oi.id
    ) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN vendor_menu vm ON vm.id = oi.menu_item_id
JOIN global_menu gm ON gm.id = vm.global_menu_id
WHERE o.order_status = $1
AND o.created_at >= NOW() - INTERVAL '1 day'
GROUP BY o.id
ORDER BY o.created_at DESC;
`,
      [orderStatus]
    );

    console.log("Pending orders fetched:", result.rows);
    if (result.rowCount === 0) throw new Error("Orders not found");
    return result.rows;
  } catch (err) {
    console.error("Error fetching pending orders:", err);
    throw err;
  }
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
