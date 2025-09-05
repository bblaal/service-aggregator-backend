const vendorService = require("../services/vendorService");

// Public
exports.getVendors = async (req, res) => {
  try {
    const { type, lat, lng, radius } = req.query;
    const vendors = await vendorService.fetchVendors(type, lat, lng, radius);
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVendorsByArea = async (req, res) => {
  try {
    const { area } = req.query;
    const vendors = await vendorService.fetchVendorsByArea(area);
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

// Vendor/Admin
exports.addVendor = async (req, res) => {
  try {
    const {  
      name,
      type,
      address,
      latitude,
      longitude,
      area,
      is_open,
      prep_time,
      service_radius,
      phone
    } = req.body;

    // if file uploaded by multer
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/vendors/${req.file.filename}`;
    }
    
    await vendorService.addVendor(
      name,
      type,
      address,
      latitude,
      longitude,
      area,
      is_open,
      prep_time,
      service_radius,
      phone,
      imageUrl
    );

    res.json({ message: "Vendor added successfully" });
  } catch (err) {
    console.error("Error adding vendor:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.updateVendorStatus = async (req, res) => {
  try {
    const { id, name, phone, service_radius, is_open, prep_time } = req.body;
    await vendorService.updateVendorStatus(id, name, phone, service_radius, is_open, prep_time);
    res.json({ message: "Vendor updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMenuItemForVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available, price } = req.body;
    await vendorService.updateMenuItemForVendor(id, is_available, price);
    res.json({ message: "Menu item updated for vendor" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMenuItemForVendor = async (req, res) => {
  try {
    const { vendorId, globalMenuId, description, price } = req.body;
    await vendorService.addMenuItemForVendor(vendorId, globalMenuId, description, price);
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
