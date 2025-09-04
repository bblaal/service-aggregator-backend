const adminService = require("../services/adminService");

exports.addNewServiceAreaPincode = async (req, res) => {
    try {
      const { area, pincode } = req.body;
      await adminService.addNewServiceAreaPincode(pincode, area);
      res.json({ message: "New PINCODE added" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  exports.fetchServiceArea = async (req, res) => {
    try {
    //   const { pincode } = req.body;
      const result = await adminService.fetchServiceArea();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  exports.addGlobalMenuItem = async (req, res) => {
    try {
      const { name } = req.body;
  
      // image path
      let imageUrl = null;
      if (req.file) {
        imageUrl = `/uploads/globalMenu/${req.file.filename}`;
      }
  
      await adminService.addGlobalMenuItem(name, imageUrl);
  
      res.json({ message: "Menu item added globally" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
