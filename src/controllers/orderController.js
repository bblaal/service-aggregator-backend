const orderService = require("../services/orderService");

exports.createFoodOrder = async (req, res) => {
  try {
    const { vendor_id, order_type, items, address_id, lat, lng, notes } = req.body;
    const { user_id } = req.body;

    // Basic validation
    if (!vendor_id) {
      return res.status(400).json({ error: "vendor_id is required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }

    // Call service method
    const order = await orderService.createFoodOrder(user_id, {
      vendor_id,
      order_type,
      items,
      address_id: address_id || null,
      lat: lat || null,
      lng: lng || null,
      notes: notes || "",
    });

    // Success response
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });

  } catch (err) {
    console.error("Error creating food order:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create order",
      details: err.message,
    });
  }
};


exports.confirmPayment = async (req, res) => {
  try {
    const { order_id, payment_intent } = req.body;
    const result = await orderService.confirmPayment(order_id, payment_intent);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id);
    res.json(order);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};


exports.getOrdersByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const orders = await orderService.getOrdersByVendor(vendorId);
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await orderService.getOrdersByUser(userId);
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllPendingOrders = async (req, res) => {
  try {
    const { orderStatus, createdDate} = req.query;
    const orders = await orderService.getAllPendingOrders(orderStatus, createdDate);
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { type, status, mine } = req.query;
    const orders = await orderService.getOrders(req.user.id, { type, status, mine });
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orders = await orderService.updateOrderStatus(req.params.id, status);
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Grocery / Medicine
exports.createGroceryIntent = async (req, res) => {
  try {
    const order = await orderService.createIntent(req.user.id, "grocery", req.body);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.createMedicineIntent = async (req, res) => {
  try {
    const order = await orderService.createIntent(req.user.id, "medicine", req.body);
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// exports.getQuote = async (req, res) => {
//   try {
//     const quote = await orderService.getQuote(req.params.id, req.user.id);
//     res.json(quote);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// exports.confirmQuote = async (req, res) => {
//   try {
//     const result = await orderService.confirmQuote(req.params.id, req.user.id, req.body.payment_intent);
//     res.json(result);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// exports.rejectQuote = async (req, res) => {
//   try {
//     const result = await orderService.rejectQuote(req.params.id, req.user.id);
//     res.json(result);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };
