const adminService = require("../services/adminService");
const XLSX = require("xlsx");

exports.addNewServiceAreaPincode = async (req, res) => {
    try {
      const { area, pincode } = req.body;
      await adminService.addNewServiceAreaPincode(pincode, area);
      res.json({ message: "New Area added" });
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

  exports.checkServiceArea = async (req, res) => {
    try {
      const { lat, lng } = req.body;
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and Longitude required" });
      }
  
      const result = await adminService.checkServiceArea(lat, lng);
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
  

exports.uploadGlobalMenuFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No Excel file uploaded" });
    }

    // read Excel buffer from memory
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // convert to JSON [{ name: "...", imageUrl: "..." }, ...]
    const rows = XLSX.utils.sheet_to_json(sheet);

    // validate structure
    if (!rows.length || !rows[0].name || !rows[0].category || !rows[0].imageUrl) {
      return res.status(400).json({ error: "Excel must have columns: name, category, imageUrl" });
    }

    // insert all rows into DB
    for (const row of rows) {
      const name = row.name;
      const imageUrl = row.imageUrl;
      const category = row.category;
      await adminService.addGlobalMenuItem(name, category, imageUrl);
    }

    res.json({ message: `${rows.length} items added to global menu` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.approveVendor = async (req, res) => {
  try {
    const {
      id,
      phone,
      service_radius,
      status,
    } = req.body;

    await adminService.approveVendor(
      id,
      phone,
      service_radius,
      status,
    );

    res.json({ message: "Vendor " + status });
  } catch (err) {
    console.error("Error in vendor:", err);
    res.status(500).json({ error: err.message });
  }
};

