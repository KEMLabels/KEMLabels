const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const customJsonParser = require("./customJsonParser");
const sessionMiddleware = require("../config/session");
const { isDevelopment } = require("../utils/helpers");

// Environment variables
const clientProdServer = process.env.PROD_FRONTEND_SERVER || "";
const clientDevServer = process.env.DEV_FRONTEND_SERVER || "";

// Middleware
const commonMiddleware = (app) => {
  // CORS middleware for cross-origin requests
  app.use(
    cors({
      origin: isDevelopment() ? clientDevServer : clientProdServer,
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
    })
  );

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));

  // Headers middleware for CORS handling and cookie settings
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Origin",
      isDevelopment() ? clientDevServer : clientProdServer
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", true);
    next();
  });

  // Cookie parser
  app.use(cookieParser());

  // Custom JSON parser
  app.use(customJsonParser);

  // Session middleware
  app.use(sessionMiddleware);
};

module.exports = commonMiddleware;
