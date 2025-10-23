const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agentController");
const {requireAuth, requireRole} = require("../middleware/authMiddleware");

// Public APIs
// router.post("/savePushToken", vendorController.savePushToken);
// router.get("/agents", agentController.getAgents);
// router.get("/globalMenu", requireAuth, requireRole("VENDOR", "ADMIN"), vendorController.fetchGlobalMenuList);
// router.get("/vendorsByArea", vendorController.getVendorsByArea);
// router.get("/:id/menu", vendorController.getVendorMenu);

// router.get("/vendors/:id", vendorController.getVendorById);
router.get("/:phone", agentController.getAgentByPhone);

// router.get("/services", vendorController.getServices);

// // vendor auth
// router.post("/login", otpLimiter, validate(phoneSchema), c.vendorLogin);
// router.post("/logout", validate(refreshSchema), c.logout);
// router.post("/auth/verify-otp", validate(verifyOtpSchema), c.verifyVendoryOtp);
// router.post("/auth/refresh", validate(refreshSchema), c.refreshToken);

// routes/vendorRoutes.js
router.post(
  "/",
  // requireAuth,
  // requireRole("VENDOR", "ADMIN"),
  agentController.addAgent
);

// routes/vendorRoutes.js
router.patch("/update", requireAuth, requireRole("AGENT", "ADMIN"), agentController.updateAgentDetails
);

// router.patch("/setup", requireAuth, vendorController.updateVendor);

// router.patch("/menu/:id/toggle", requireAuth, requireRole("VENDOR", "ADMIN"), vendorController.toggleAvailability);
// router.post("/menu/add", requireAuth, requireRole("VENDOR", "ADMIN"), vendorController.addMenuItemForVendor);

module.exports = router;
