const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const { isDevelopment } = require("../utils/helpers");
const logger = require("../utils/logger");

// Session store
const store = new MongoDBStore({
  uri: process.env.DB_STRING,
  collection: "sessions",
});

// Catch errors in session store
store.on("error", (err) => {
  const error = typeof err === Object ? JSON.stringify(err) : err;
  logger(`Session store error:\n${error}`, "error");
});

// Session middleware configuration options for express-session
const sessionConfig = {
  store: store,
  name: "sessionID",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  maxAge: 1000 * 60 * 60 * 24, // 1 day
  cookie: {
    httpOnly: true,
    secure: !isDevelopment(), // true in production
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: isDevelopment() ? "lax" : "none",
    domain: isDevelopment() ? "localhost" : "kemlabels.com",
  },
};

// Initialize session middleware with configuration options
module.exports = session(sessionConfig);
