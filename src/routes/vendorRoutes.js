const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const {requireAuth, requireRole} = require("../middleware/authMiddleware");


// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../uploads/vendors")); // save to /uploads/vendors
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    },
  });
  const upload = multer({ storage });

// Public APIs
router.get("/vendors", vendorController.getVendors);
router.get("/vendorsByArea", vendorController.getVendorsByArea);
router.get("/vendors/:id", vendorController.getVendorById);
router.get("/vendors/:id/menu", vendorController.getVendorMenu);
router.get("/services", vendorController.getServices);

// Vendor/Admin APIs (Protected)
router.post(
  "/",
  requireAuth,
  requireRole("VENDOR", "ADMIN"),
  upload.single("image"),   // <-- inserted here
  vendorController.addVendor
);
router.patch("/vendor/status", requireAuth, requireRole("VENDOR", "ADMIN"), upload.single("image"), vendorController.updateVendorStatus);
router.patch("/vendor/menu/items/:id", requireAuth, requireRole("VENDOR", "ADMIN"), vendorController.updateMenuItemForVendor);
router.post("/vendors/menu/items/add", requireAuth, requireRole("VENDOR", "ADMIN"), vendorController.addMenuItemForVendor);
router.get("/globalMenu", requireAuth, requireRole("VENDOR", "ADMIN"), vendorController.fetchGlobalMenuList);

module.exports = router;
