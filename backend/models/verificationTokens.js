const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
    },
    userid: {
      type: String,
    },
    createdAt: {
      type: Date,
      expires: "15m",
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("verificationTokens", verificationTokenSchema);
