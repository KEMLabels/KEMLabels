const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    userNameLastChanged: {
      type: Date,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    customPricing: {
      USPS: {
        "Express: 1-2 days": {
          type: Number,
          default: 20,
        },
        "Priority: 1-3 days": {
          type: Number,
          default: 15,
        },
        "Ground Advantage: 1-5 days": {
          type: Number,
          default: 10,
        },
      },
      "UPS CA": {
        "Express Early: 1 day": {
          type: Number,
          default: 25,
        },
        "Express: 1 day": {
          type: Number,
          default: 20,
        },
        "Express Saver: 1 day": {
          type: Number,
          default: 20,
        },
        "Expedited: 2 days": {
          type: Number,
          default: 15,
        },
        "Standard: Flexible": {
          type: Number,
          default: 10,
        },
      },
      "UPS USA": {
        "Next Day Air Early: 1 day": {
          type: Number,
          default: 25,
        },
        "Next Day Air: 1 day": {
          type: Number,
          default: 20,
        },
        "2nd Day Air: 2 days": {
          type: Number,
          default: 15,
        },
        "3 Day Select: 3 days": {
          type: Number,
          default: 10,
        },
        "Ground: Min 3 days": {
          type: Number,
          default: 10,
        },
      },
    },
    senderInfo: {
      name: {
        type: String,
        default: "",
      },
      address1: {
        type: String,
        default: "",
      },
      address2: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      state: {
        type: String,
        default: "",
      },
      postal_code: {
        type: String,
        default: "",
      },
      phone: {
        type: String,
        default: "",
      },
      country: {
        type: String,
        default: "",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("users", userSchema);
