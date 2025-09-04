const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const requireAuth = require("../middleware/auth");
const { requireRole } = require("../middleware/authMiddleware");

// Food orders
router.post("/v1/orders/food", requireAuth, orderController.createFoodOrder);
router.get("/v1/orders/:id", requireAuth, orderController.getOrderById);
router.get("/v1/orders", requireAuth, orderController.getOrders);
router.patch("/v1/orders/:id", requireAuth, orderController.updateOrderStatus);

// Payment confirmation
router.post("/v1/payments/confirm", orderController.confirmPayment);

// Grocery & Medicine
router.post("/v1/orders/grocery-intent", requireAuth, orderController.createGroceryIntent);
router.post("/v1/orders/medicine-intent", requireAuth, orderController.createMedicineIntent);
// router.get("/v1/orders/:id/quote", requireAuth, orderController.getQuote);
// router.post("/v1/orders/:id/confirm-quote", requireAuth, orderController.confirmQuote);
// router.post("/v1/orders/:id/reject-quote", requireAuth, orderController.rejectQuote);

module.exports = router;
