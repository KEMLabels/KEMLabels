const multer = require("multer");
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "shippingLabels/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

router.get("/senderInfo", orderController.getSenderInfo);
router.get("/label/pricings", orderController.getLabelPricings);
router.post("/label/single", orderController.createSingleLabel);
router.post(
  "/label/bulk",
  upload.single("file"),
  orderController.createBulkLabels
);

module.exports = router;
