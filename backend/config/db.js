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
    logger("Error connecting to DB:\n" + err, "error");
    process.exit(1);
  }
};

module.exports = connectDB;
