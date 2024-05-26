const bcrypt = require("bcryptjs");
require("express-async-errors");
const UserModel = require("../models/users");
const logger = require("../utils/logger");
const { generateVerificationUrl } = require("../utils/helpers");
const { sendSignUpEmail } = require("../services/email");

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      logger("Signin failed: Email or password missing.", "error");
      return res.status(404).json({ msg: "Please enter all fields." });
    }

    const emailLower = email.toLowerCase();
    const user = await UserModel.findOne({ email: emailLower });
    if (!user) {
      logger(
        `Signin failed: User not found for email '${emailLower}'.`,
        "error"
      );
      return res.status(400).json({ msg: "Incorrect email or password." });
    }

    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      logger(
        `Signin failed: Password incorrect for email '${emailLower}'.`,
        "error"
      );
      return res.status(400).json({ msg: "Incorrect email or password." });
    }

    req.session.user = user;
    await req.session.save((err) => {
      if (err) {
        logger(`Error saving session: ${JSON.stringify(err)}`, "error");
        return res.status(500).json({ msg: "Failed to save session." });
      }
      logger(`User ${emailLower} signed in successfully.`, "info");
      res.status(200).json({
        redirect: "/",
        userInfo: {
          username: user.userName,
          creditAmount: user.credits,
          joinedDate: user.createdAt,
          isVerified: user.verified,
        },
      });
    });
  } catch (err) {
    logger(`Error signing in: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({ msg: err.message });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger(`Error logging out: ${JSON.stringify(err)}`, "error");
      return res.status(500).json({ msg: "Error logging out." });
    }
    res.clearCookie("sessionID");
    logger("User logged out successfully.", "info");
    res.status(200).json({ redirect: "/signin" });
  });
};

const signUp = async (req, res) => {
  try {
    const { email, password, userName } = req.body;
    if (!email || !password || !userName) {
      logger("Signup failed: Email, password, or username missing.", "error");
      return res.status(404).json({ msg: "Please enter all fields." });
    }

    const emailLower = email.toLowerCase();
    const userNameLower = userName.toLowerCase();

    const userExists = await UserModel.findOne({ email: emailLower });
    if (userExists) {
      logger(
        `Signup failed: User already exists for email '${emailLower}'.`,
        "error"
      );
      return res
        .status(400)
        .json({ msg: "This email is already associated with an account." });
    }

    const userNameExists = await UserModel.findOne({ userName: userNameLower });
    if (userNameExists) {
      logger(
        `Signup failed: Username already exists for username '${userNameLower}'.`,
        "error"
      );
      return res.status(400).json({ msg: "This username is already taken." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new UserModel({
      email: emailLower,
      password: hashedPassword,
      userName: userNameLower,
    });
    await newUser.save();
    logger(`New user created for ${emailLower}.`, "info");

    const verificationUrl = await generateVerificationUrl(newUser._id);
    await sendSignUpEmail(emailLower, verificationUrl);

    req.session.user = newUser;
    await req.session.save((err) => {
      if (err) {
        logger(`Error saving session: ${JSON.stringify(err)}`, "error");
        return res.status(500).json({ msg: "Failed to save session." });
      }
      logger(`User ${emailLower} signed up successfully.`, "info");
      res.status(201).json({ redirect: "/verify-email" });
    });
  } catch (err) {
    logger(`Error signing up: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = { signIn, logout, signUp };
