const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const labelsCleanupCronJob = () => {
  cron.schedule("0 0 * * 0", () => {
    logger(
      "Starting labels cleanup cron job to delete shipping labels.",
      "info"
    );
    try {
      const directory = path.join(__dirname, "../shippingLabels");
      if (!fs.existsSync(directory)) {
        logger("Shipping labels directory does not exist", "error");
        return;
      }

      const files = fs.readdirSync(directory);
      for (const file of files) {
        fs.unlinkSync(`${directory}/${file}`, (err) => {
          if (err) {
            const error = typeof err === Object ? JSON.stringify(err) : err;
            logger(
              `Failed to delete shipping label PDF file: ${error}`,
              "error"
            );
          }
        });
      }
      logger(
        `Labels cleanup cron job completed. Deleted ${files.length} shipping label PDF files.`,
        "info"
      );
    } catch (err) {
      const error = typeof err === Object ? JSON.stringify(err) : err;
      logger(
        `Cron Job Error: Failed to cleanup shipping label files: ${error}`,
        "error"
      );
    }
  });
};

module.exports = labelsCleanupCronJob;
