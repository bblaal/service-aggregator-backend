const express = require("express");
const router = express.Router();
const c = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const {
  phoneSchema, verifyOtpSchema, refreshSchema} = require("../utils/validators");
const { otpLimiter } = require("../middleware/rateLimit");

// auth
router.post("/login", otpLimiter, validate(phoneSchema), c.userLogin);
router.post("/logout", validate(refreshSchema), c.logout);
router.post("/verify-otp", validate(verifyOtpSchema), c.verifyUserOtp);
router.post("/refresh", validate(refreshSchema), c.refreshToken);


router.post("/admin", c.adminLogin);

module.exports = router;
