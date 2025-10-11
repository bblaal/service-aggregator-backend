const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");



// order for vendor
router.get("/:vendorId", requireAuth, requireRole("VENDOR"), orderController.getOrdersByVendor);

// Food orders
router.post("/create", orderController.createFoodOrder);
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
