const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");

router.post("/signin", authController.signIn);
router.post("/signup", authController.signUp);
router.get("/logout", authController.logout);

module.exports = router;
