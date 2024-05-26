const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment");

router.post("/stripe/create", paymentController.createStripePaymentIntent);
router.post("/webhook", paymentController.stripeWebhook);
router.post("/crypto/create", paymentController.createCryptoPaymentIntent);
router.post("/crypto/webhook", paymentController.cryptoWebhook);
router.get("/creditHistory", paymentController.getCreditHistory);

module.exports = router;
