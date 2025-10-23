const express = require("express");
const router = express.Router();
const c = require("../controllers/serviceController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");


router.get("/:area", c.getServicesCategoryByArea);
router.get("/:area/all", c.getAllServicesByArea);

router.get("/:category/:area", c.getServicesByCategoryAndArea);
router.post("/:area", requireAuth, requireRole("ADMIN"), c.addService);
// router.put("/addresses/:id", requireAuth, validate(addressUpdateSchema), c.updateAddress);
// router.delete("/addresses/:id", requireAuth, c.deleteAddress);

module.exports = router;
