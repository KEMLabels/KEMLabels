const bcrypt = require("bcryptjs");
require("express-async-errors");
const UserModel = require("../models/users");
const VerificationTokenModel = require("../models/verificationTokens");
const OtpModel = require("../models/otps");
const logger = require("../utils/logger");
const { generateOtp, generateVerificationUrl } = require("../utils/helpers");
const {
  sendSignUpEmail,
  sendForgotPasswordEmail,
  sendPasswordUpdateEmail,
  sendUsernameUpdateEmail,
  sendEmailUpdateRequestEmail,
  sendEmailUpdateOtpEmail,
  sendPasswordUpdateOtpEmail,
  sendEmailUpdateEmail,
} = require("../services/email");

// Check if email exists for Forgot Password
const emailExists = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      logger("Email check failed: Email missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const emailLower = email.toLowerCase();
    const user = await UserModel.findOne({ email: emailLower });
    if (!user) {
      logger(`Email not found for ${emailLower}.`, "error");
      return res.status(404).json({
        msg: "Hmm... this email is not associated with an account. Please try again.",
      });
    }

    logger(`Email found for ${emailLower}.`, "info");
    res.status(200).json({ user: user });
  } catch (err) {
    logger(`Error checking if email exists: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({
      msg: err.message || "Internal server error.",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      logger("Forgot password failed: Email missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const otp = await generateOtp(email);
    await sendForgotPasswordEmail(email, otp);
    res.status(200).json({ msg: "OTP sent to email successfully." });
  } catch (err) {
    logger(`Error generating or sending OTP: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({
      msg: err.message || "Internal server error.",
    });
  }
};

const validateOtp = async (req, res) => {
  try {
    const { email, enteredOtp } = req.body;
    if (!email || !enteredOtp) {
      logger("OTP validation failed: Email or OTP missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const emailLower = email.toLowerCase();
    logger(`Validating OTP for ${emailLower}.`, "info");
    const otp = await OtpModel.findOne({ email: emailLower });
    if (!otp) {
      logger(
        `OTP verification failed: OTP Code not found for ${emailLower}.`,
        "error"
      );
      return res.status(400).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    if (Number(enteredOtp) !== Number(otp.passcode)) {
      logger(
        `OTP verification failed: Incorrect code for ${emailLower}.`,
        "error"
      );
      return res.status(400).json({
        msg: "Hmm... your code was incorrect. Please try again.",
      });
    }
    logger(`OTP verification successful for ${emailLower}.`, "info");
    res.status(200).json({ msg: "Verification successful." });
  } catch (err) {
    logger(`Error validating OTP: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({
      msg: err.message || "Internal server error.",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { user } = req.session;
    if (!user || !user._id || !user.email) {
      logger("Email verification failed: User ID or email missing.", "error");
      return res.status(404).json({ msg: "User ID or email missing." });
    }

    const token = await VerificationTokenModel.findOne({ userid: user._id });
    if (token) {
      await VerificationTokenModel.deleteOne({ _id: token._id });
      logger(
        `Verification token found and deleted for user ${user._id}.`,
        "info"
      );
    }

    const verificationUrl = await generateVerificationUrl(user._id);
    await sendSignUpEmail(user.email, verificationUrl);
  } catch (err) {
    logger(`Error verifying email: ${JSON.stringify(err)}`, "error");
    return res
      .status(500)
      .json({ msg: err.message || "Internal server error." });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { id, token } = req.params;
    if (!id || !token) {
      logger(
        "User token verification failed: session ID or token missing.",
        "error"
      );
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      logger(`User not found for ID ${id}.`, "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const tokenFound = await VerificationTokenModel.findOne({ token: token });
    if (!tokenFound) {
      const previoustoken = await VerificationTokenModel.findOne({
        userid: id,
      });
      if (previoustoken) {
        if (previoustoken.token !== token) {
          logger(`Verification link expired for user: ${id}.`, "error");
          return res.status(400).json({ msg: "Link Expired" });
        }
      } else {
        logger(`Verification link invalid for user: ${id}.`, "error");
        return res.status(400).json({ msg: "Link Invalid" });
      }
    }

    // Update user verification status
    await UserModel.updateOne({ _id: id }, { verified: true });
    logger(`User ${id} verified successfully.`, "info");

    // Update the session
    req.session.user.verified = true;

    // Delete the verification token
    await VerificationTokenModel.deleteOne({ _id: tokenFound._id });
    logger(`Verification token deleted for user ${id}.`, "info");

    res.status(200).json({ redirect: "/" });
  } catch (err) {
    logger(`Error verifying user: ${JSON.stringify(err)}`, "error");
    return res
      .status(500)
      .json({ msg: err.message || "Internal server error." });
  }
};

const checkUserVerification = async (req, res) => {
  try {
    const { user } = req.session;
    if (!user || !user._id) {
      logger(
        "User verification check failed: User session ID missing.",
        "error"
      );
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    if (!user.verified) {
      logger(`User ${user.email} is not verified.`, "info");
      return res.status(400).json({
        msg: "Please check your inbox for a verification link to verify your account.",
      });
    }

    logger(`User is verified: ${user.email}`, "info");
    res.status(200).json({ redirect: "/" });
  } catch (err) {
    logger(`Error checking user verification: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({ msg: err.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      logger("Password update failed: Email or password missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const emailLower = email.toLowerCase();
    const user = await UserModel.findOne({ email: emailLower });
    if (!user) {
      logger(
        `User not found for ${emailLower} during password update.`,
        "error"
      );
      return res.status(404).json({ msg: "User not found for this email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await UserModel.updateOne({ _id: user._id }, { password: hashedPassword });

    await sendPasswordUpdateEmail(emailLower);
    logger(`Password updated successfully for ${emailLower}.`, "info");
    res.status(200).json({ redirect: "/signin" });
  } catch (err) {
    logger(`Error updating password: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({ msg: err.message });
  }
};

const updateUsername = async (req, res) => {
  try {
    const { newUserName } = req.body;
    const userId = req.session.user._id;
    if (!newUserName) {
      logger("Username update failed: Username missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }
    if (!userId) {
      logger("Username update failed: User id missing from session.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const newUserNameLower = newUserName.toLowerCase();
    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      logger(`User not found for ${userId} during username update.`, "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    // Check if it has been more than 24 hours since the last username update
    if (user.userNameLastChanged) {
      const currentDate = new Date();
      const diff = Math.abs(currentDate - user.userNameLastChanged);
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const remainingHours = 24 - hours;
      const remainingMinutes = 60 - minutes;

      if (
        remainingHours > 0 ||
        (remainingHours === 0 && remainingMinutes > 0)
      ) {
        logger(
          `Username update failed: User ${userId} must wait ${remainingHours} hours and ${remainingMinutes} minutes before updating again.`,
          "error"
        );
        if (remainingHours === 0) {
          return res.status(400).json({
            msg: "You must wait ${remainingMinutes} minutes before updating your username again.",
          });
        } else {
          return res.status(400).json({
            msg: `You must wait ${remainingHours} hours and ${remainingMinutes} minutes before updating your username again.`,
          });
        }
      }
    }

    // Check if the new username is the same as the current one
    if (user.userName === newUserNameLower) {
      logger(
        `Username update failed: User ${userId} entered the same username.`,
        "error"
      );
      return res.status(400).json({
        msg: "Please enter a new username that is different from the current one.",
      });
    }

    // Check if the new username is already taken by another user
    const userNameExists = await UserModel.findOne({
      userName: newUserNameLower,
    });
    if (userNameExists) {
      logger(
        `Username update failed: Username ${newUserNameLower} already exists.`,
        "error"
      );
      return res.status(400).json({
        msg: "This username is already taken. Please try another one.",
      });
    }

    // Update the username and the last changed date
    await UserModel.updateOne(
      { _id: user._id },
      { userName: newUserNameLower, userNameLastChanged: new Date() }
    );

    // Update the session
    req.session.user.userName = newUserNameLower;

    await sendUsernameUpdateEmail(user.email);
    logger(
      `Username updated successfully for user ${user.email} to ${newUserNameLower}.`,
      "info"
    );
    res.status(200).json({ msg: "Username updated successfully." });
  } catch (err) {
    logger(`Error updating username: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({ msg: err.message });
  }
};

const updateEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.session.user._id;
    if (!newEmail) {
      logger("Email update failed: Email missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }
    if (!userId) {
      logger("Email update failed: User id missing from session.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      logger(`User not found for ${userId} during email update.`, "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    // Update the email and set the user to unverified
    const newEmailLower = newEmail.toLowerCase();
    await UserModel.updateOne(
      { _id: user._id },
      { email: newEmailLower, verified: false }
    );
    logger(
      `Email updated successfully for user ${user.email} to ${newEmailLower}.`,
      "info"
    );

    // Update the session
    req.session.user.email = newEmailLower;

    await sendEmailUpdateEmail(newEmailLower);
    res.status(200).json({ msg: "Email updated successfully." });
  } catch (err) {
    logger(`Error updating email: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({ msg: err.message });
  }
};

// Initial request and confirmation for email update
const updateEmailRequest = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const user = req.session.user;
    if (!newEmail) {
      logger("Email update request failed: Email missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }
    if (!user || !user.email) {
      logger("Email update request failed: User session missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    // Check if the new email is the same as the current one
    const newEmailLower = newEmail.toLowerCase();
    if (newEmailLower === user.email) {
      logger(
        "Email update request failed: New email is the same as the current one.",
        "error"
      );
      return res.status(400).json({
        msg: "Please enter a new email that is different from the current one.",
      });
    }

    // Check if the new email is already taken by another user
    const emailExists = await UserModel.findOne({ email: newEmailLower });
    if (emailExists) {
      logger(
        "Email update request failed: New email is already taken.",
        "error"
      );
      return res.status(400).json({
        msg: "This email is already taken. Please try another one.",
      });
    }

    // Generate and send OTP to new email
    const otp = await generateOtp(newEmailLower);
    await sendEmailUpdateRequestEmail(user.email); // Send email to current email to confirm the change
    await sendEmailUpdateOtpEmail(newEmailLower, otp); // Send email to new email with OTP code

    res.status(200).json({
      msg: `An email to verify your new email with instructions has been sent to ${newEmailLower}.`,
    });
  } catch (err) {
    logger(
      `Error processing email update request: ${JSON.stringify(err)}`,
      "error"
    );
    return res.status(500).json({ msg: err.message });
  }
};

// Initial request and confirmation for password update
const updatePasswordRequest = async (req, res) => {
  try {
    const { enteredPassword, newPassword } = req.body;
    const user = req.session.user;
    if (!enteredPassword || !newPassword) {
      logger("Password update request failed: Password missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    if (!user || !user.email || !user.password) {
      logger("Password update request failed: User session missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    // Check if the entered password matches the current password
    const isPasswordMatch = await bcrypt.compare(
      enteredPassword,
      user.password
    );
    if (!isPasswordMatch) {
      logger(
        "Password update request failed: Entered password is incorrect.",
        "error"
      );
      return res.status(400).json({
        msg: "Hmm... your current password is incorrect. Please try again.",
      });
    }

    // Check if the new password is the same as the current one
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      logger(
        "Password update request failed: New password is the same as the current one.",
        "error"
      );
      return res.status(400).json({
        msg: "Please enter a new password that is different from the current one.",
      });
    }

    // Generate and send OTP to email
    const otp = await generateOtp(user.email);
    await sendPasswordUpdateOtpEmail(user.email, otp);

    res.status(200).json({
      msg: `An email with instructions to reset your password has been sent to ${user.email}.`,
    });
  } catch (err) {
    logger(
      `Error processing password update request: ${JSON.stringify(err)}`,
      "error"
    );
    return res.status(500).json({ msg: err.message });
  }
};

// Resend email or password update request with OTP
const resendOtpEmail = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email || !type) {
      logger("Resend request failed: Email or type missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const emailLower = email.toLowerCase();
    const otp = await generateOtp(emailLower);

    if (type === "email") {
      await sendEmailUpdateOtpEmail(emailLower, otp);
    } else if (type === "password") {
      await sendPasswordUpdateOtpEmail(emailLower, otp);
    } else {
      logger("Resend request failed: Invalid type.", "error");
      return res.status(400).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    res.status(200).json({
      msg: `An email with instructions to reset your ${type} has been sent to ${emailLower}.`,
    });
  } catch (err) {
    logger(
      `Error resending update ${type} request: ${JSON.stringify(err)}`,
      "error"
    );
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = {
  emailExists,
  forgotPassword,
  validateOtp,
  verifyEmail,
  verifyUser,
  checkUserVerification,
  updatePassword,
  updateUsername,
  updateEmail,
  updateEmailRequest,
  updatePasswordRequest,
  resendOtpEmail,
};
