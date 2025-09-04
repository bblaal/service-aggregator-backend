const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_SECRET || "access";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh";
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || "30d";

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, phone: user.phone, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, phone: user.phone, role:user.role }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

function verifyRefresh(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = { signAccessToken, verifyAccess, signRefreshToken, verifyRefresh };
