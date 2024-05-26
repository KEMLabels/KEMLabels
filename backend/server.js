const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const commonMiddleware = require("./middlewares/common");
const usersCleanupCronJob = require("./cron/usersCleanup");
const labelsCleanupCronJob = require("./cron/labelsCleanup");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const paymentRoutes = require("./routes/payment");
const orderRoutes = require("./routes/order");

// Initialize app and connect to database
const app = express();

// Set mongoose and express configurations
mongoose.set("strictQuery", false);
app.set("trust proxy", 1);

// Apply middleware to app
commonMiddleware(app);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/order", orderRoutes);

// Error handling
app.use((err, req, res, next) => {
  logger(`Error Handler: ${err.message}`, "error");
  res.status(500).json({ msg: "Internal server error" });
});

// 404 route
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// Cron Jobs
usersCleanupCronJob();
labelsCleanupCronJob();

// Start server
try {
  const PORT = process.env.PORT || 8081;
  if (fs.existsSync("logs.log")) fs.writeFileSync("logs.log", "");
  logger("Running on environment: " + process.env.NODE_ENV);
  connectDB();
  app.listen(PORT, () => {
    logger(`Server is running on port ${PORT}`, "info");
  });
} catch (err) {
  logger("Error starting server:\n" + err, "error");
}
