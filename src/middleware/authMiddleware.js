const createHttpError = require("http-errors");
const { verifyAccess } = require("../utils/jwt");

function requireAuth(req, _res, next) {
  const auth = req.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return next(createHttpError(401, "Missing Bearer token"));
  }
  try {
    const payload = verifyAccess(auth.slice(7));
    req.user = { id: payload.sub, phone: payload.phone, role:payload.role };
    next();
  } catch {
    next(createHttpError(401, "Invalid or expired token"));
  }
}

// middlewares/requireRole.js
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
