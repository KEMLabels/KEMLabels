const log4js = require("log4js");

log4js.configure({
  appenders: { logs: { type: "file", filename: "logs.log" } },
  categories: { default: { appenders: ["logs"], level: "ALL" } },
});
const logger = log4js.getLogger("logs");
const log = (message, level = "info") => {
  if (level === "info") console.log(message);
  else console.error(message);
  logger[level](message);
};

module.exports = log;
