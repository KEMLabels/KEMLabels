require("express-async-errors");
const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger("Connected to DB", "info");
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger("Error connecting to DB:\n" + error, "error");
    process.exit(1);
  }
};

module.exports = connectDB;
