const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");


// Admin only - create agent
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads/agents"));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    },
});
const upload = multer({ storage });

router.post(
    "/agents",
    requireAuth,
    requireRole("ADMIN"),
    upload.single("image"),   // handle image upload
    deliveryController.createAgent);

router.get("/agentsByArea", requireAuth, requireRole("ADMIN"), deliveryController.fetchAllAgents);

// Delivery assignment
router.post("/deliveries", requireAuth, deliveryController.createDelivery);

// Delivery location updates
router.patch("/deliveries/:id/location", requireAuth, deliveryController.updateDeliveryLocation);

// Get delivery details
router.get("/deliveries/:id", requireAuth, deliveryController.getDelivery);

module.exports = router;
