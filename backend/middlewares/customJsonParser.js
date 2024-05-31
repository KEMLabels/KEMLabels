const express = require("express");

function customJsonParser(req, res, next) {
  // If the request is for "/crypto/webhook", skip the JSON parsing
  if (
    (req.path === "/api/v1/payment/crypto/webhook" && req.method === "POST") ||
    (req.path === "/api/v1/payment/webhook" && req.method === "POST")
  ) {
    express.raw({ type: "application/json" })(req, res, next);
  } else express.json()(req, res, next); // For all other requests, use express.json()
}

module.exports = customJsonParser;
