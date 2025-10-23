const servicesService = require("../services/localService");

// exports.addNewServiceAreaPincode = async (req, res) => {
//     try {
//       const { area, pincode } = req.body;
//       await adminService.addNewServiceAreaPincode(pincode, area);
//       res.json({ message: "New Area added" });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   };

  exports.getServicesByArea = async (req, res) => {
    try {
      const area = req.params.area;
      const result = await servicesService.getServicesByArea(area);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  exports.getServicesByCategoryAndArea = async (req, res) => {
    try {
      const area = req.params.area;
      const category = req.params.category;
      const result = await servicesService.getServicesByCategoryAndArea(area, category);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  

