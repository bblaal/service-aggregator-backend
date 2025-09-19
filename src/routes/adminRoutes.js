const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {requireAuth, requireRole} = require("../middleware/authMiddleware");


router.post("/addServiceArea", requireAuth, requireRole("ADMIN"), adminController.addNewServiceAreaPincode);

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
  

  // excel add route
// use memoryStorage since we don't need to save file
const storage_excel_read = multer.memoryStorage();
const upload_excel_read = multer({ storage_excel_read });

// Upload Excel for global menu (ADMIN only)
router.post(
  "/globalMenu/uploadExcel",
  requireAuth,
  requireRole("ADMIN"),
  upload_excel_read.single("excel"),   // upload excel file
  adminController.uploadGlobalMenuFromExcel
);

  router.get("/fetchServiceArea", adminController.fetchServiceArea)

  router.post("/checkServiceArea", adminController.checkServiceArea);
module.exports = router;
