const createHttpError = require("http-errors");
const { signAccessToken, signRefreshToken, verifyRefresh } = require("../utils/jwt");
const {
  authenticateAdmin, findUserByPhone, createUser, updateUserProfile, getUserById,
  upsertOtp, verifyAndConsumeOtp,
  storeRefreshToken, revokeRefreshToken, isRefreshTokenActive,
  addAddress, listAddresses, updateAddress, deleteAddress
} = require("../services/userService");

const { generateOtp } = require("../utils/otp"); // you can keep your generator or inline it
const ms = require("ms");

// request OTP
exports.requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await upsertOtp(phone, code, process.env.OTP_TTL_SEC || 300);

    // TODO: integrate SMS provider here
    console.log(`[OTP] ${phone} -> ${code}`);

    res.json({ success: true, message: "OTP sent" });
  } catch (err) { next(err); }
};

// verify OTP -> login/register
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, role } = req.body;
    const result = await verifyAndConsumeOtp(phone, otp);
    if (!result.ok) return next(createHttpError(400, result.reason));

    let user = await findUserByPhone(phone);
    if (!user) user = await createUser(phone, role);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const refreshExp = new Date(Date.now() + ms(process.env.REFRESH_TOKEN_TTL || "30d"));
    await storeRefreshToken(user.id, refreshToken, refreshExp);


    res.json({
      success: true,
      token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, role: user.role, phone: user.phone, name: user.name, email: user.email }
    });
  } catch (err) { next(err); }
};

// refresh tokens
exports.refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!await isRefreshTokenActive(refresh_token)) {
      return next(createHttpError(401, "Invalid refresh token"));
    }
    const payload = verifyRefresh(refresh_token);
    const user = await getUserById(payload.sub);
    if (!user) return next(createHttpError(401, "User not found"));

    const newAccess = signAccessToken(user);
    const newRefresh = signRefreshToken(user);

    // rotate: revoke old and store new
    await revokeRefreshToken(refresh_token);
    const ms = require("ms");
    const refreshExp = new Date(Date.now() + ms(process.env.REFRESH_TOKEN_TTL || "30d"));
    await storeRefreshToken(user.id, newRefresh, refreshExp);

    res.json({ success: true, token: newAccess, refresh_token: newRefresh });
  } catch (err) { next(err); }
};

// logout
exports.logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) await revokeRefreshToken(refresh_token);
    res.json({ success: true, message: "Logged out" });
  } catch (err) { next(err); }
};

// me
exports.getMe = async (req, res, next) => {
  try {
    const me = await getUserById(req.user.id);
    res.json(me);
  } catch (err) { next(err); }
};

exports.updateMe = async (req, res, next) => {
  try {
    await updateUserProfile(req.user.id, req.body);
    const me = await getUserById(req.user.id);
    res.json({ success: true, user: me });
  } catch (err) { next(err); }
};

// addresses
exports.createAddress = async (req, res, next) => {
  try {
    const addr = await addAddress(req.user.id, req.body);
    res.status(201).json({ success: true, address: addr });
  } catch (err) { next(err); }
};
exports.listAddresses = async (req, res, next) => {
  try {
    const list = await listAddresses(req.user.id);
    res.json(list);
  } catch (err) { next(err); }
};
exports.updateAddress = async (req, res, next) => {
  try {
    await updateAddress(req.user.id, req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { next(err); }
};
exports.deleteAddress = async (req, res, next) => {
  try {
    await deleteAddress(req.user.id, req.params.id);
    res.json({ success: true });
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


