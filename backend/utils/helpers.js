const crypto = require("crypto");
require("express-async-errors");
const OtpModel = require("../models/otps");
const VerificationTokenModel = require("../models/verificationTokens");
const logger = require("./logger");
const isDevelopment = () => process.env.NODE_ENV === "development";

async function generateOtp(email) {
  try {
    // Delete any existing OTP for the user
    const existingOtp = await OtpModel.findOneAndDelete({
      email: email.toLowerCase(),
    });
    if (existingOtp) {
      logger(`Existing OTP found and deleted for ${email}.`, "info");
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    const newOtp = new OtpModel({ passcode: otp, email: email });
    await newOtp.save();
    logger(`OTP generated and saved for ${email}.`, "info");
    return otp;
  } catch (err) {
    logger(`Error generating OTP: ${JSON.stringify(err)}`, "error");
    throw new Error(`Error generating OTP: ${JSON.stringify(err)}`);
  }
}

async function generateVerificationUrl(userId) {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const newToken = new VerificationTokenModel({
      token: token,
      userid: userId,
    });
    await newToken.save();
    logger(`Verification token created and saved for user ${userId}.`, "info");

    const clientProdServer = process.env.PROD_FRONTEND_SERVER || "";
    const clientDevServer = process.env.DEV_FRONTEND_SERVER || "";
    const server = isDevelopment() ? clientDevServer : clientProdServer;
    return `${server}/users/${userId}/verify/${token}`;
  } catch (err) {
    logger(
      `Error generating verification token or URL: ${JSON.stringify(err)}`,
      "error"
    );
    throw new Error(
      `Error generating verification token or URL: ${JSON.stringify(err)}`
    );
  }
}

module.exports = { isDevelopment, generateOtp, generateVerificationUrl };
