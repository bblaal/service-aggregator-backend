const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {requireAuth, requireRole} = require("../middleware/authMiddleware");


router.post("/pincode/add", requireAuth, requireRole("ADMIN"), adminController.addNewServiceAreaPincode);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../uploads/globalMenu"));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    },
  });
  const upload = multer({ storage });
  
  // Add Global Menu Item (ADMIN only)
  router.post(
    "/globalMenu/add",
    requireAuth,
    requireRole("ADMIN"),
    upload.single("image"),   // handle image upload
    adminController.addGlobalMenuItem
  );
  
  router.get("/fetchServiceArea", requireAuth, adminController.fetchServiceArea)
module.exports = router;
