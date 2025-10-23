const {
  updateUserProfile, getUserById,
  addAddress, listAddresses, listAreaAddresses, updateAddress, deleteAddress
} = require("../services/userService");

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
    const addr = await addAddress(req.params.userId, req.body);
    res.status(201).json({ success: true, address: addr });
  } catch (err) { next(err); }
};
exports.listAddresses = async (req, res, next) => {
  try {
    const list = await listAddresses(req.user.id);
    res.json(list);
  } catch (err) { next(err); }
};

exports.listAreaAddresses = async (req, res, next) => {
  try {
    const list = await listAreaAddresses(req.params.userId, req.params.area);
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




