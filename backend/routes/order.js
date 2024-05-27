require("express-async-errors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");
const logger = require("../utils/logger");

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
  (req, res, next) => {
    const email = req.body.email;
    if (!email) {
      logger("Error uploading bulk label file: Email is missing.", "error");
      next("Email is missing.");
    }

    // Create a directory for the user if it doesn't exist
    const uploadPath = path.join("shippingLabels", email);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Generate a new filename
    const oldFileName = req.file.originalname.split(".");
    const date = Date.now();
    const newFileName = `${oldFileName[0]}-${date}.${oldFileName[1]}`;

    // Move the file to the user's directory
    const oldPath = path.join("shippingLabels", req.file.originalname);
    const newPath = path.join(uploadPath, newFileName);
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        const error = typeof err === Object ? JSON.stringify(err) : err;
        logger(`Error moving bulk labels order file: ${error}`, "error");
        next(err);
      }
    });

    // Update the file contents in the request body
    req.body.file = {
      ...req.file,
      path: `shippingLabels/${email}/${newFileName}`,
      originalname: newFileName,
      filename: newFileName,
      destination: `shippingLabels/${email}`,
    };
    next();
  },
  orderController.createBulkLabels
);

module.exports = router;
