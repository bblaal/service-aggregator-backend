const rateLimit = require("express-rate-limit");

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const max = Number(process.env.RATE_LIMIT_MAX || 60);

const globalLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10,                  // 10 OTP requests/10min/ip
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests, please try later." }
});

module.exports = { globalLimiter, otpLimiter };
