const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const createHttpError = require("http-errors");
const { signAccessToken, signRefreshToken, verifyRefresh } = require("../utils/jwt");
const {
    findUserByPhone, getUserById,
    createUser } = require("../services/userService");
const ms = require("ms");
// generate otp
async function generateAndStoreOtp(phone, ttlSec = process.env.OTP_TTL_SEC || 300) {
    try {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + Number(ttlSec) * 1000);

        await pool.query(
            `INSERT INTO otps (phone, code, expires_at)
         VALUES ($1, $2, $3)`,
            [phone, code, expiresAt]
        );

        // TODO: integrate SMS provider here
        console.log(`[OTP] ${phone} -> ${code}`);

        return true
        // ⚠️ you might not want to return `code` in production
    } catch (err) {
        // let the caller handle errors
        throw err;
    }
}

// verify otp
async function verifyOtpService(phone, otp, role = "USER") {
    try {
      // 1. Check OTP
      const { rows } = await pool.query(
        `SELECT * FROM otps 
         WHERE phone = $1 AND consumed = false 
         ORDER BY created_at DESC LIMIT 1`,
        [phone]
      );
      const row = rows[0];
      if (!row) return { ok: false, reason: "OTP not requested" };
  
      if (row.expires_at < new Date()) return { ok: false, reason: "OTP expired" };
  
      if (row.code !== otp) {
        await pool.query("UPDATE otps SET attempts = attempts + 1 WHERE id = $1", [row.id]);
        if ((row.attempts + 1) >= Number(process.env.OTP_MAX_ATTEMPTS || 5)) {
          await pool.query("UPDATE otps SET consumed = true WHERE id = $1", [row.id]);
        }
        return { ok: false, reason: "Invalid OTP" };
      }
  
      await pool.query("UPDATE otps SET consumed = true WHERE id = $1", [row.id]);
  
      // 2. Find or create user
      let user = await findUserByPhone(phone);
      if (!user) user = await createUser(phone, role);
  
      // 3. Always generate *fresh* tokens (so legacy users get refresh token too)
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
  
      const refreshExp = new Date(Date.now() + ms(process.env.REFRESH_TOKEN_TTL || "30d"));
      await storeRefreshToken(user.id, refreshToken, refreshExp);
  
      return {
        ok: true,
        token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          role: user.role,
          phone: user.phone,
          name: user.name,
          email: user.email,
        },
      };
    } catch (err) {
      throw err;
    }
  }  

// admin login
async function authenticateAdmin(username, password) {
    const result = await pool.query(
      "SELECT * FROM admin WHERE username = $1",
      [username]
    );
  
    if (result.rows.length === 0) {
      throw new Error("NOT_ADMIN");
    }
  
    const user = result.rows[0];
  
    if (user.password !== password) {
      throw new Error("INVALID_CREDENTIALS");
    }
  
    return user
}

// REFRESH TOKENS
async function rotateRefreshToken(oldRefreshToken) {
    let payload = null;
    try {
      payload = verifyRefresh(oldRefreshToken);
    } catch (err) {
      console.log("Invalid or expired refresh token, trying fallback rotation...");
    }
  
    let user = null;
    if (payload?.sub) {
      user = await getUserById(payload.sub);

    } else {
      // Try fallback: maybe token was revoked, find any active one and re-issue
      const row = await pool.query(
        "SELECT * FROM refresh_tokens WHERE token = $1",
        [oldRefreshToken]
      );
      if (row.rows[0]) {
        user = await getUserById(row.rows[0].user_id);
      }
    }

    if (!user) return { ok: false, reason: "User not found or invalid token" };
  
    const newAccess = signAccessToken(user);
    const newRefresh = signRefreshToken(user);
  
    // Revoke old (if exists)
    await pool.query("UPDATE refresh_tokens SET revoked = true WHERE token = $1", [oldRefreshToken]);
  
    const refreshExp = new Date(Date.now() + ms(process.env.REFRESH_TOKEN_TTL || "30d"));
    await storeRefreshToken(user.id, newRefresh, refreshExp);
  
    return {
      ok: true,
      token: newAccess,
      refresh_token: newRefresh,
    };
  }

async function storeRefreshToken(userId, token, expiresAt) {
    const id = uuidv4();
    await pool.query(
        "INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)",
        [id, userId, token, expiresAt]
    );
}
async function revokeRefreshToken(token) {
    await pool.query("UPDATE refresh_tokens SET revoked = true WHERE token = $1", [token]);
}
async function isRefreshTokenActive(token) {
    const r = await pool.query(
        "SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()",
        [token]
    );
    return !!r.rows[0];
}

module.exports = {
    authenticateAdmin,
    // otp
    generateAndStoreOtp, verifyOtpService,
    // token
    rotateRefreshToken, storeRefreshToken, revokeRefreshToken, isRefreshTokenActive
};