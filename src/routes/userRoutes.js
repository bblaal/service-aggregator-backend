const express = require("express");
const router = express.Router();
const c = require("../controllers/userController");
const { requireAuth } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const {
  phoneSchema, verifyOtpSchema, refreshSchema,
  updateProfileSchema, addressCreateSchema, addressUpdateSchema
} = require("../utils/validators");
const { otpLimiter } = require("../middleware/rateLimit");

// Auth
router.post("/auth/request-otp", otpLimiter, validate(phoneSchema), c.requestOtp);
router.post("/auth/verify-otp", validate(verifyOtpSchema), c.verifyOtp);
router.post("/auth/refresh", validate(refreshSchema), c.refresh);
router.post("/auth/logout", validate(refreshSchema), c.logout);
router.post("/auth/admin", c.adminLogin);

// Me
router.get("/me", requireAuth, c.getMe);
router.put("/me", requireAuth, validate(updateProfileSchema), c.updateMe);

// Addresses
router.get("/addresses", requireAuth, c.listAddresses);
router.post("/addresses", requireAuth, validate(addressCreateSchema), c.createAddress);
router.put("/addresses/:id", requireAuth, validate(addressUpdateSchema), c.updateAddress);
router.delete("/addresses/:id", requireAuth, c.deleteAddress);

module.exports = router;
