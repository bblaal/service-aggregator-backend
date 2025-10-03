const createHttpError = require("http-errors");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");

const {
  generateAndStoreOtp, verifyOtpService, authenticateAdmin,
  // token
  rotateRefreshToken, storeRefreshToken, revokeRefreshToken} = require("../services/authService");

  const ms = require("ms");

// request OTP
exports.userLogin = async (req, res, next) => {
    try {
      const { phone } = req.body;
  
      const success = await generateAndStoreOtp(phone);
  
      if (!success) {
        return next(createHttpError(500, "Failed to generate OTP"));
      }
  
      res.json({ success: true, message: "OTP sent" });
    } catch (err) {
      next(err);
    }
  };
  
  // verify OTP -> user login
  exports.verifyUserOtp = async (req, res, next) => {
    try {
      const { phone, otp, role } = req.body;
      const result = await verifyOtpService(phone, otp, role);
  
      if (!result.ok) return next(createHttpError(400, result.reason));
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };
  
  // refresh tokens
  exports.refreshToken = async (req, res, next) => {
    try {
      const { refresh_token } = req.body;
      const result = await rotateRefreshToken(refresh_token);
  
      if (!result.ok) {
        return next(createHttpError(401, result.reason));
      }
  
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };
  
  // logout
  exports.logout = async (req, res, next) => {
    try {
      const { refresh_token } = req.body;
      if (refresh_token) await revokeRefreshToken(refresh_token);
      res.json({ success: true, message: "Logged out" });
    } catch (err) { next(err); }
  };

  // admin - login
exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user =
        await authenticateAdmin(username, password);
  
        const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
  
    const refreshExp = new Date(
      Date.now() + ms(process.env.REFRESH_TOKEN_TTL || "30d")
    );
  
    await storeRefreshToken(user.id, refreshToken, refreshExp);
  
      res.json({
        success: true,
        token: accessToken,
        refresh_token: refreshToken,
        user: {
          user: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
  
      if (err.message === "NOT_ADMIN") {
        return res.status(401).json({ error: "You are not admin" });
      }
      if (err.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({ error: "Invalid username or password" });
      }
  
      res.status(500).json({ error: "Login failed" });
    }
  };