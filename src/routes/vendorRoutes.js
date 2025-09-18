const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const {requireAuth, requireRole} = require("../middleware/authMiddleware");

// Public APIs
router.get("/vendors", vendorController.getVendors);
router.get("/vendorsByArea", vendorController.getVendorsByArea);
router.get("/vendors/:id", vendorController.getVendorById);
router.get("/vendors/:id/menu", vendorController.getVendorMenu);
router.get("/services", vendorController.getServices);

// routes/vendorRoutes.js
router.post(
  "/",
  requireAuth,
  requireRole("VENDOR", "ADMIN"),
  vendorController.addVendor
);

// routes/vendorRoutes.js
router.patch(
  "/vendor/status",
  requireAuth,
  requireRole("VENDOR", "ADMIN"),
  vendorController.updateVendorStatus
);

router.patch("/vendor/menu/items/:id", requireAuth, requireRole("VENDOR", "ADMIN"), vendorController.updateMenuItemForVendor);
router.post("/vendors/menu/items/add", requireAuth, requireRole("VENDOR", "ADMIN"), vendorController.addMenuItemForVendor);
router.get("/globalMenu", requireAuth, requireRole("VENDOR", "ADMIN"), vendorController.fetchGlobalMenuList);

module.exports = router;
