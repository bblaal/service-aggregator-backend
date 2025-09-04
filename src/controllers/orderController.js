const orderService = require("../services/orderService");

exports.createFoodOrder = async (req, res) => {
  try {
    const { vendor_id, items, address_id, lat, lng, notes } = req.body;
    const order = await orderService.createFoodOrder(req.user.id, { vendor_id, items, address_id, lat, lng, notes });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
