const cron = require("node-cron");
require("express-async-errors");
const UserModel = require("../models/users");
const logger = require("../utils/logger");

// This cron job will run every day at midnight to clean up unverified users
const usersCleanupCronJob = () => {
  cron.schedule("0 0 */1 * *", async () => {
    logger(
      "Starting users cleanup cron job to delete unverified users who signed up more than 24 hours ago",
      "info"
    );
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const res = await UserModel.deleteMany({
        verified: false,
        createdAt: { $lt: twentyFourHoursAgo },
      });
      logger(
        `Users cleanup cron job completed. Deleted ${res.deletedCount} unverified users`,
        "info"
      );
    } catch (err) {
      logger(
        `Cron Job Error: Failed to cleanup unverified users: ${JSON.stringify(
          err
        )}`,
        "error"
      );
    }
  });
};

module.exports = usersCleanupCronJob;
