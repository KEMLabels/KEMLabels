const cron = require("node-cron");
const fs = require("fs");
const logger = require("../utils/logger");

const labelsCleanupCronJob = () => {
  cron.schedule("0 0 * * 0", () => {
    logger(
      "Starting labels cleanup cron job to delete shipping labels.",
      "info"
    );
    try {
      const directory = "shippingLabels/";
      if (!fs.existsSync) {
        logger("Shipping labels directory does not exist", "error");
        return;
      }

      const files = fs.readdirSync(directory);
      for (const file of files) {
        fs.unlinkSync(`${directory}/${file}`, (err) => {
          if (err)
            logger(
              `Failed to delete shipping label PDF file: ${JSON.stringify(
                err
              )}`,
              "error"
            );
        });
      }
      logger(
        `Labels cleanup cron job completed. Deleted ${files.length} shipping label PDF files.`,
        "info"
      );
    } catch (err) {
      logger(
        `Cron Job Error: Failed to cleanup shipping label files: ${JSON.stringify(
          err
        )}`,
        "error"
      );
    }
  });
};

module.exports = labelsCleanupCronJob;
