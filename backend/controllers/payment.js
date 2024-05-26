require("express-async-errors");
const coinbase = require("coinbase-commerce-node");
const { format } = require("date-fns");
const { isDevelopment } = require("../utils/helpers");
const stripe = require("stripe")(
  isDevelopment()
    ? process.env.DEV_STRIPE_SECRET_KEY
    : process.env.PROD_STRIPE_SECRET_KEY
);
const UserModel = require("../models/users");
const logger = require("../utils/logger");

// Initialize Coinbase client
coinbase.Client.init(process.env.COINBASE_API_KEY || "");

// Create a Stripe Payment Intent with the order amount and currency
const createStripePaymentIntent = async (req, res) => {
  try {
    const { amount, email } = req.body;
    if (!amount || !email) {
      logger(
        "Create Stripe Payment Intent failed: Amount or email missing.",
        "error"
      );
      return res.status(400).json({ msg: "Please provide amount." });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      receipt_email: email,
      automatic_payment_methods: { enabled: false },
      metadata: { email: email },
    });
    logger(
      `Stripe Payment Intent created successfully: ${JSON.stringify(
        paymentIntent
      )}`,
      "info"
    );
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    logger(
      `Error creating Stripe Payment Intent: ${JSON.stringify(err)}`,
      "error"
    );
    return res.status(500).json({ msg: err.message });
  }
};

// Handle Stripe webhook events for payment success and update user credits
const stripeWebhook = async (req, res) => {
  const devStripeWebhookSecret = process.env.DEV_STRIPE_WEBHOOK_SECRET || "";
  const prodStripeWebhookSecret = process.env.PROD_STRIPE_WEBHOOK_SECRET || "";
  const signature = req.headers["stripe-signature"];
  let event;

  if (!signature) {
    logger("Stripe Webhook error: No Stripe signature found.", "error");
    return res
      .status(500)
      .send("An unexpected error occurred. Please try again later.");
  }

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      isDevelopment() ? devStripeWebhookSecret : prodStripeWebhookSecret
    );

    if (!event) {
      logger("Stripe Webhook error: Event not constructed.", "error");
      return res
        .status(500)
        .send("An unexpected error occurred. Please try again later.");
    }

    if (event.type !== "payment_intent.succeeded") {
      logger(
        `Stripe Webhook error: Unexpected event type: ${event.type}`,
        "error"
      );
      return res.status(500).end();
    }
  } catch (err) {
    logger(`Stripe Webhook error: ${JSON.stringify(err)}`, "error");
    return res.status(500).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event and update the database
  try {
    logger(`Stripe Webhook received: ${JSON.stringify(event)}`, "info");
    const paymentIntent = event.data.object;
    logger(
      `Stripe payment succeeded, PaymentIntent: ${JSON.stringify(
        paymentIntent
      )}`,
      "info"
    );

    const user = await UserModel.findOne({
      email: paymentIntent.metadata.email,
    });
    if (!user) {
      logger("Stripe Webhook error: User not found.", "error");
      return res.status(404).json({ msg: "User not found." });
    }

    // Update user's credits
    user.credits += Number(paymentIntent.amount) / 100;
    await user.save();
    logger(
      `User credits updated successfully for ${user.email}, credits: ${user.credits}`,
      "info"
    );
  } catch (err) {
    logger(`Error updating user credits: ${JSON.stringify(err)}`, "error");
    return res
      .status(500)
      .json({ msg: err.message || "Internal server error" });
  }
  res.status(200).end();
};

// Create a Crypto Payment Intent with the order amount and currency
const createCryptoPaymentIntent = async (req, res) => {
  try {
    const { amount, email } = req.body;
    if (!amount || !email) {
      logger(
        "Create Crypto Payment Intent failed: Amount or email missing.",
        "error"
      );
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }

    const clientServer = isDevelopment()
      ? process.env.DEV_FRONTEND_SERVER
      : process.env.PROD_FRONTEND_SERVER;

    // Create a crypto charge with the order amount and currency
    const cryptoCharge = await coinbase.resources.Charge.create({
      name: "KEMLabels Credit Deposit",
      description: "Deposit credits to your KEMLabels account",
      local_price: {
        amount: amount,
        currency: "USD",
      },
      pricing_type: "fixed_price",
      metadata: { email: email },
      cancel_url: `${clientServer}/load-credits`,
      redirect_url: `${clientServer}/load-credits`,
    });
    logger(
      `Crypto Payment created successfully: ${JSON.stringify(cryptoCharge)}`,
      "info"
    );
    res.status(200).json({ redirect: cryptoCharge.hosted_url });
  } catch (err) {
    logger(`Error creating Crypto Payment Intent: ${err}`, "error");
    return res.status(500).json({ msg: err.message });
  }
};

// Handle Coinbase webhook events for payment success and update user credits
const cryptoWebhook = async (req, res) => {
  const signature = req.headers["x-cc-webhook-signature"];
  let event;

  if (!signature) {
    logger("Coinbase Webhook error: No Coinbase signature found.", "error");
    return res
      .status(400)
      .send("An unexpected error occurred. Please try again later.");
  }

  try {
    event = coinbase.Webhook.verifyEventBody(
      req.body,
      signature,
      process.env.COINBASE_WEBHOOK_SECRET || ""
    );

    if (!event) {
      logger("Coinbase Webhook error: Event not verified.", "error");
      return res
        .status(500)
        .send("An unexpected error occurred. Please try again later.");
    }

    if (event.type !== "charge:confirmed" && event.type !== "charge:resolved") {
      logger(
        `Coinbase Webhook error: Unexpected event type: ${event.type}`,
        "error"
      );
      return res.status(500).end();
    }
  } catch (err) {
    logger(`Coinbase Webhook error: ${JSON.stringify(err)}`, "error");
    return res.status(500).send(`Coinbase Webhook Error: ${err.message}`);
  }

  // Handle the event and update the database
  try {
    logger(`Coinbase Webhook received: ${JSON.stringify(event)}`, "info");
    const user = await UserModel.findOne({ email: event.metadata.email });
    if (!user) {
      logger("Coinbase Webhook error: User not found.", "error");
      return res.status(404).json({ msg: "User not found." });
    }

    // Update user's credits with a 10% bonus
    user.credits += Number(event.local.amount) * 1.1;
    await user.save();
    logger(
      `User credits updated successfully for ${user.email}, credits: ${user.credits}`,
      "info"
    );
  } catch (err) {
    logger(`Error updating user credits: ${JSON.stringify(err)}`, "error");
    return res
      .status(500)
      .json({ msg: err.message || "Internal server error" });
  }
  res.status(200).end();
};

// Get all Stripe payments for the user
const getStripePayments = async (email) => {
  try {
    logger(`Retrieving Stripe payments for user: ${email}.`, "info");
    const paymentIntents = await stripe.paymentIntents.search({
      query: `status:\'succeeded\' AND metadata[\'email\']:\'${email}\'`,
      limit: 100,
    });
    logger(
      `Successfully retrieved ${paymentIntents.data.length} Stripe payments.`,
      "info"
    );

    const payments = [];
    for (const paymentIntent of paymentIntents.data) {
      const createdTimestamp = paymentIntent.created * 1000;
      const createdDate = format(new Date(createdTimestamp), "MMMM dd, yyyy");
      const createdTime = format(new Date(createdTimestamp), "hh:mm a");
      const statusMap = { succeeded: "Success", processing: "Processing" };

      payments.push({
        refId: paymentIntent.id,
        paymentDate: createdDate,
        paymentTime: createdTime,
        amount: paymentIntent.amount / 100, // Convert to dollars
        type: "Credit Card",
        status: statusMap[paymentIntent.status] || "Failed",
      });
    }
    return payments;
  } catch (err) {
    logger(`Error retrieving Stripe payments: ${JSON.stringify(err)}`, "error");
    return [];
  }
};

// Get all Coinbase payments for the user
const getCoinbasePayments = async (email) => {
  try {
    logger(`Retrieving Coinbase payments for user: ${email}.`, "info");
    const chargeList = await coinbase.resources.Charge.list(
      {},
      (err, list, pagination) => {
        if (err) {
          logger(
            `Error retrieving Coinbase payments: ${JSON.stringify(err)}`,
            "error"
          );
          return [];
        }
      }
    );

    const charges = chargeList[0].filter(
      (charge) => charge.metadata.email === email
    );
    if (!charges) {
      logger(`No Coinbase payments found for user: ${email}.`, "info");
      return [];
    }
    logger(
      `Successfully retrieved ${charges.length} Coinbase payments.`,
      "info"
    );

    const payments = [];
    for (const charge of charges) {
      const statusMapping = {
        created: "Processing",
        pending: "Processing",
        confirmed: "Success",
      };

      // @TODO: Double check which one fetches correctly.
      // payments.push({
      //   refId: charge.id,
      //   paymentDate: format(new Date(charge.created_at), "MMMM dd, yyyy"),
      //   paymentTime: format(new Date(charge.created_at), "hh:mm a"),
      //   amount: charge.pricing.local.amount,
      //   type: "Crypto",
      //   status: statusMapping[charge.timeline[0].status] || "Failed",
      // });

      for (const payment of charge.payments) {
        const createdTimestamp = payment.detected_at;
        const createdDate = format(new Date(createdTimestamp), "MMMM dd, yyyy");
        const createdTime = format(new Date(createdTimestamp), "hh:mm a");
        payments.push({
          refId: payment.payment_id,
          paymentDate: createdDate,
          paymentTime: createdTime,
          amount: payment.value.local.amount,
          type: "Crypto",
          status: statusMapping[payment.status.toLowerCase()] || "Failed",
        });
      }
    }
    return payments;
  } catch (err) {
    logger(
      `Error retrieving Coinbase payments: ${JSON.stringify(err)}`,
      "error"
    );
    return [];
  }
};

// Get all payments history for the user (Stripe and Coinbase)
const getCreditHistory = async (req, res) => {
  try {
    const { email } = req.session.user;
    if (!email) {
      logger("Get Credit History failed: Email missing.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again later.",
      });
    }
    logger(`Retrieving credit history for user: ${email}.`, "info");

    // Get all payments for the user
    const payments = [];
    const stripePayments = await getStripePayments(email);
    if (stripePayments) payments.push(...stripePayments);
    const cryptoPayments = await getCoinbasePayments(email);
    if (cryptoPayments) payments.push(...cryptoPayments);

    // Sort payments by date and time in descending order
    payments.sort((a, b) => {
      const dateA = new Date(a.paymentDate);
      const dateB = new Date(b.paymentDate);
      if (dateA === dateB) {
        const timeA = new Date(a.paymentTime);
        const timeB = new Date(b.paymentTime);
        return timeB - timeA;
      }
      return dateB - dateA;
    });

    logger(`Successfully retrieved ${payments.length} payments.`, "info");
    res.status(200).json({ payments: payments });
  } catch (err) {
    logger(`Error retrieving credit history: ${JSON.stringify(err)}`, "error");
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = {
  createStripePaymentIntent,
  stripeWebhook,
  createCryptoPaymentIntent,
  cryptoWebhook,
  getCreditHistory,
};
