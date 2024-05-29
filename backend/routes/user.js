const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");

router.post("/emailExists", userController.emailExists);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/validateOtp", userController.validateOtp);
router.get("/verifyEmail", userController.verifyEmail);
router.get("/:id/verify/:token", userController.verifyUser);
router.get("/checkVerification", userController.checkUserVerification);
router.post("/updatePassword", userController.updatePassword);
router.post("/updateUsername", userController.updateUsername);
router.post("/updateEmail", userController.updateEmail);
router.post("/updateEmailRequest", userController.updateEmailRequest);
router.post("/updatePasswordRequest", userController.updatePasswordRequest);
router.post("/resendOtpEmail", userController.resendOtpEmail);

module.exports = router;
