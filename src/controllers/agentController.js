const agentService = require("../services/agentService");

// vendor login
// request OTP
exports.vendorLogin = async (req, res, next) => {
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
exports.verifyVendorOtp = async (req, res, next) => {
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


// Public
exports.getAgents = async (req, res) => {
  try {
    const { type, lat, lng, radius } = req.query;
    const agents = await agentService.fetchAgents(type, lat, lng, radius);
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVendorsByArea = async (req, res) => {
  try {
    const { area, status } = req.query;
    const vendors = await vendorService.fetchVendorsByArea(area, status);
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVendorById = async (req, res) => {
  try {
    const vendor = await vendorService.fetchVendorById(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAgentByPhone = async (req, res) => {
  try {
    const agent = await agentService.fetchAgentByPhone(req.params.phone);
    if (!agent) return res.status(404).json({ error: "Agent not found with phone" });
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVendorMenu = async (req, res) => {
  try {
    const menu = await vendorService.fetchVendorMenu(req.params.id);
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { category, city } = req.query;
    const services = await vendorService.fetchServices(category, city);
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// agent management
exports.addAgent = async (req, res) => {
  try {
    const agent = await agentService.addAgent(req.body);

    res.status(201).json({
      message: "Agent added successfully",
      agent, // ✅ send the full agent object back
    });
  } catch (err) {
    console.error("Error adding agent:", err);
    res.status(500).json({ error: err.message });
  }
};



exports.updateVendorStatus = async (req, res) => {
  try {
    const {
      id,
      name,
      phone,
      service_radius,
      is_open,
      prep_time,
      image_url,   // <-- take directly from body
    } = req.body;

    await vendorService.updateVendorStatus(
      id,
      name,
      phone,
      service_radius,
      is_open,
      prep_time,
      image_url
    );

    res.json({ message: "Vendor updated" });
  } catch (err) {
    console.error("Error updating vendor:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.id; // Prefer JWT user.id, fallback to body

    if (!userId) {
      return res.status(400).json({ error: "Vendor ID is required" });
    }

    // Collect only the fields that were sent in PATCH
    const {
      service_radius,
      prep_time,
      fssai_lic,
      image,
      latitude,
      longitude,
      full_details_completed,
      status
    } = req.body;

    // Build an object of only provided fields
    const updateData = {};
    if (service_radius !== undefined) updateData.service_radius = service_radius;
    if (prep_time !== undefined) updateData.prep_time = prep_time;
    if (fssai_lic !== undefined) updateData.fssai_lic = fssai_lic;
    if (image !== undefined) updateData.image_url = image; // normalize column name
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (full_details_completed != undefined) updateData.full_details_completed = full_details_completed;
    if (status != undefined) updateData.status = status

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    await vendorService.updateVendor(userId, updateData);

    res.json({ status:200, message: "Vendor updated successfully" });
  } catch (err) {
    console.error("Error updating vendor:", err);
    res.status(500).json({ error: err.message });
  }
};

// menu management
exports.toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;
    await vendorService.toggleAvailability(id, availability);
    res.json({ message: "Menu item updated for vendor" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMenuItemForVendor = async (req, res) => {
  try {
    const { vendorId, globalMenuId, category, description, sellingPrice, vendorPrice } = req.body;
    await vendorService.addMenuItemForVendor(vendorId, globalMenuId, category, description, sellingPrice, vendorPrice);
    res.json({ message: "Menu item  for vendor" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.fetchGlobalMenuList = async (req, res) => {
  try {
    const menuList = await vendorService.fetchGlobalMenuList();
    res.json(menuList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.savePushToken = async (req, res, next) => {
  try {
    const { vendorId, token } = req.body;
    await vendorService.savePushToken(vendorId, token);
    res.json({ success: true, message: "Push token saved" });
  } catch (err) {
    next(err);
  }
};

