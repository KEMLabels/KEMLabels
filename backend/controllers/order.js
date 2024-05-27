const nodeFetch = require("node-fetch");
const fs = require("fs");
const XLSX = require("xlsx");
const AdmZip = require("adm-zip");
require("express-async-errors");
const UserModel = require("../models/users");
const logger = require("../utils/logger");
const {
  sendLabelOrderCustomerEmail,
  sendLabelOrderAdminEmail,
} = require("../services/email");

// Helper function to update the sender info in the database
const updateSenderInfoDb = async (email, senderInfo) => {
  try {
    // Fetch user data from the database
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      logger(
        `DB failed to update sender info: User not found for email: ${email}`,
        "error"
      );
      throw new Error("User not found for the given email.");
    }

    // Update the sender info in the database
    user.senderInfo = {
      name: `${senderInfo.firstName} ${senderInfo.lastName}`,
      address1: senderInfo.street,
      address2: senderInfo.suite,
      city: senderInfo.city,
      state: senderInfo.state,
      postal_code: senderInfo.zip,
      phone: senderInfo.phone,
      country: senderInfo.country,
    };
    await user.save();

    logger(`Sender Info updated in the database for email: ${email}`, "info");
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`DB failed to update sender info: ${error}`, "error");
    throw new Error("DB failed to update sender info.");
  }
};

// Helper function to update the user's credit balance in the database
const updateCreditBalanceDb = async (email, totalPrice) => {
  try {
    // Fetch user data from the database
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      logger(
        `DB failed to update user's credit balance: User not found for email: ${email}`,
        "error"
      );
      throw new Error("User not found for the given email.");
    }

    // Update the user's credit balance in the database
    user.credits -= Number(totalPrice);
    await user.save();
    logger(
      `User's credit balance updated in the database for email: ${email}, credits: ${user.credits}`,
      "info"
    );
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`DB failed to update user's credit balance: ${error}`, "error");
    throw new Error("DB failed to update user's credit balance.");
  }
};

// Helper function to get the country, saturday delivery, and endpoint based on courier
const getLabelEndpointAndOptions = (courier) => {
  let country = null;
  let satDelivery = null;
  let endpoint = null;
  switch (courier) {
    case "UPS USA":
      country = "US";
      satDelivery = false;
      endpoint = process.env.LABEL_API_ORDER_CREATE_UPS;
      break;
    case "UPS CA":
      country = "CA";
      satDelivery = false;
      endpoint = process.env.LABEL_API_ORDER_CREATE_UPS;
      break;
    case "USPS":
      endpoint = process.env.LABEL_API_ORDER_CREATE_USPS;
      break;
    default:
      return { msg: "Please select a valid courier.", status: "failed" };
  }
  return { status: "success", data: { country, satDelivery, endpoint } };
};

// Helper function to upload the shipping label PDF to the server
const uploadShippingLabelPdf = async (buffer, filename, email) => {
  try {
    if (!fs.existsSync("../shippingLabels")) fs.mkdirSync("../shippingLabels");
    if (!fs.existsSync(`../shippingLabels/${email}`)) {
      fs.mkdirSync(`../shippingLabels/${email}`);
    }
    fs.writeFileSync(`../shippingLabels/${email}/${filename}`, buffer);
    logger(
      `Shipping Label PDF uploaded successfully for email: ${email}`,
      "info"
    );
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`Error uploading shipping label PDF: ${error}`, "error");
    throw new Error("Error uploading shipping label PDF.");
  }
};

// Helper function to handle the Single Shipping Label Order PDF
// and send an email with PDF label to the customer and KEMLabels
const handleSingleLabelOrderPdf = async (tracking, labelPdf, email) => {
  try {
    const filename = `label_${tracking}_${new Date().toISOString()}.pdf`;
    const buffer = Buffer.from(labelPdf, "base64");

    // Upload the shipping label PDF to the server
    await uploadShippingLabelPdf(buffer, filename, email);

    // Send email with the shipping label PDF to customer and KEMLabels
    await sendLabelOrderCustomerEmail(email, buffer, filename, tracking);
    await sendLabelOrderAdminEmail(email, buffer, filename, tracking);
    logger(
      `Shipping Label PDF email sent successfully to customer and KEMLabels for tracking number: ${tracking}`,
      "info"
    );
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`Error handling shipping label order PDF: ${error}`, "error");
    throw new Error("Error handling shipping label order PDF.");
  }
};

// Helper function to fetch a Single Label Order from Label API
const fetchSingleLabel = async (
  endpoint,
  uuid,
  formValues,
  signature,
  country = null,
  satDelivery = null
) => {
  const { courier, senderInfo, recipientInfo, packageInfo } = formValues;
  if (!courier || !senderInfo || !recipientInfo || !packageInfo) {
    logger("Single Label Order creation failed: Missing data.", "error");
  }

  // Store the reference numbers in an array if they exist
  const references = [];
  if (packageInfo.referenceNumber) references.push(packageInfo.referenceNumber);
  if (packageInfo.referenceNumber2) {
    references.push(packageInfo.referenceNumber2);
  }

  // Set the class type based on the signature
  const classType = signature
    ? formValues.classType.split(":")[0] + " Signature"
    : formValues.classType.split(":")[0];

  // Create the body for the API request
  const body = {
    uuid: uuid,
    service_speed: `${courier} ${classType}`,
    sender: {
      name: `${senderInfo.firstName} ${senderInfo.lastName}`,
      address1: senderInfo.street,
      address2: senderInfo.suite,
      city: senderInfo.city,
      state: senderInfo.state,
      postal_code: senderInfo.zip,
      phone: senderInfo.phone,
    },
    recipient: {
      name: `${recipientInfo.firstName} ${recipientInfo.lastName}`,
      address1: recipientInfo.street,
      address2: recipientInfo.suite,
      city: recipientInfo.city,
      state: recipientInfo.state,
      postal_code: recipientInfo.zip,
      phone: recipientInfo.phone,
    },
    package: {
      weight: packageInfo.weight,
      length: packageInfo.length,
      width: packageInfo.width,
      height: packageInfo.height,
      description: packageInfo.description,
      reference: references,
    },
  };

  // Optional fields for saturday delivery and country
  if (satDelivery) body.package.saturday_delivery = satDelivery;
  if (country) body.country = country;

  logger(
    `Single Label Order creation request body: ${JSON.stringify(body)}`,
    "info"
  );
  const response = await nodeFetch(endpoint, {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await response.json();
  logger(
    `Single Label Order creation response: ${JSON.stringify(data)}`,
    "info"
  );
  return data;
};

// Create a Single Label Order
const createSingleLabel = async (req, res) => {
  try {
    const { email, totalPrice, formValues, signature, isSenderInfoSaved } =
      req.body;
    const uuid = "6c66fbee-ef2e-4358-a28b-c9dc6a7eccaf"; // @TODO: Hardcoded UUID

    if (
      !email ||
      !totalPrice ||
      !formValues ||
      !signature ||
      !isSenderInfoSaved
    ) {
      logger("Single Label Order creation failed: Missing data.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again.",
      });
    }

    const user = await UserModel.findOne({ email: email });
    if (!user) {
      logger(
        `Single Label Order creation failed: User not found for email: ${email}`,
        "error"
      );
      return res.status(404).json({
        msg: "User not found for the given email.",
      });
    }

    // Check if the user has enough credits to create a label
    if (user.credits < totalPrice) {
      logger(
        `Single Label Order creation failed: Insufficient credits for email: ${email}`,
        "error"
      );
      return res.status(400).json({
        msg: "Insufficient credit balance.",
      });
    }

    // Fetch user data from Label API to check if user exists
    const fetchUserResponse = await nodeFetch(process.env.LABEL_API_USER_INFO, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ uuid: uuid }),
    });

    const userData = await fetchUserResponse.json();
    logger(`User data fetched: ${JSON.stringify(userData)}`, "info");
    if (!userData || userData.status !== "success") {
      logger(
        "Single Label Order creation failed: Label API User data fetch failed.",
        "error"
      );
      return res.status(500).json({
        msg: userData?.message || "Label API User data fetch failed.",
      });
    }

    // Get country, saturday delivery, and endpoint based on courier
    const labelEndpointData = getLabelEndpointAndOptions(formValues.courier);
    if (!labelEndpointData || labelEndpointData.status !== "success") {
      logger(
        `Single Label Order creation failed: Invalid courier. Courier: ${formValues.courier}`,
        "error"
      );
      return res.status(400).json({ msg: labelEndpointData.msg });
    }
    const { country, satDelivery, endpoint } = labelEndpointData.data;

    // Fetch a label from Label API to create a Single Label Order
    const fetchLabelResponse = await fetchSingleLabel(
      endpoint,
      uuid,
      formValues,
      signature,
      country,
      satDelivery
    );

    if (!fetchLabelResponse || fetchLabelResponse.status !== "success") {
      logger(
        `Single Label Order creation failed: Label API Label fetch failed. API Response: ${JSON.stringify(
          fetchLabelResponse
        )}`,
        "error"
      );
      return res.status(500).json({
        msg: fetchLabelResponse?.message || "Label API Label fetch failed.",
      });
    }
    logger(
      `Single Label Order created successfully. API Response: ${JSON.stringify(
        fetchLabelResponse
      )}`,
      "info"
    );

    // Update the sender info in the database if isSenderInfoSaved is true
    if (isSenderInfoSaved) {
      await updateSenderInfoDb(email, formValues.senderInfo);
    }

    // Update the user's credit balance in the database
    await updateCreditBalanceDb(email, totalPrice);

    // Create a shipping label order PDF and send it to the user
    const { tracking, label_pdf, receipt_pdf } = fetchLabelResponse.data;
    if (!tracking || !label_pdf) {
      logger(
        `Single Label Order creation failed: Missing data in API response. API Response: ${JSON.stringify(
          fetchLabelResponse
        )}`,
        "error"
      );
      return res.status(500).json({ msg: "Internal server error." });
    }
    await handleSingleLabelOrderPdf(tracking, label_pdf, email);

    return res.status(200).json({
      msg: "Single Label Order created successfully.",
    });
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`Error processing Single Label Order Request: ${error}`, "error");
    return res.status(500).json({
      msg: err.message || "Internal server error.",
    });
  }
};

// Helper function to parse the bulk order file
// and return the parsed data in a structured format
const parseBulkOrderFile = async (bulkOrderFile) => {
  try {
    const workbook = XLSX.readFile(bulkOrderFile.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (parsedData.length < 3) {
      logger(
        `Bulk Label Order creation failed: Invalid bulk order file. File: ${bulkOrderFile.originalname}`,
        "error"
      );
      return null;
    }

    const labels = parsedData[0];
    const orders = parsedData.slice(2);

    // Check if there are more than 100 orders in the bulk order file
    if (orders.length > 100) {
      logger(
        "Bulk Label Order creation failed: Maximum 100 orders allowed in a bulk order file.",
        "error"
      );
      return null;
    }

    const data = {
      signature: labels[2].toLowerCase() === "yes",
      courier: labels[0],
      classType: labels[1],
      orders: [],
    };

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      data.orders.push({
        courier: labels[0],
        classType: labels[1],
        senderInfo: {
          country: order[0],
          name: order[1],
          phone: order[2],
          street: order[3],
          suite: order[4],
          city: order[5],
          zip: order[6],
          state: order[7],
        },
        recipientInfo: {
          country: order[8],
          name: order[9],
          phone: order[10],
          street: order[11],
          suite: order[12],
          city: order[13],
          zip: order[14],
          state: order[15],
        },
        packageInfo: {
          length: order[16],
          height: order[17],
          width: order[18],
          weight: order[19],
          description: order[20],
          referenceNumber: order[21],
          referenceNumber2: order[22],
        },
      });
    }

    return data;
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`Error parsing bulk order file: ${error}`, "error");
    return null;
  }
};

// Helper function to handle the Bulk Shipping Label Order PDF
// to upload the PDFs to the server and send an email with the zip file
const handleBulkOrderPdf = async (trackingNumbers, pdfBuffers, email) => {
  try {
    const zip = new AdmZip();

    // For each PDF buffer, upload the PDF to the server and add it to the zip
    for (let i = 0; i < pdfBuffers.length; i++) {
      const filename = `label_${
        trackingNumbers[i]
      }_${new Date().toISOString()}.pdf`;
      await uploadShippingLabelPdf(pdfBuffers[i], filename, email);
      zip.addFile(filename, pdfBuffers[i]);
    }

    const zipBuffer = zip.toBuffer();
    const zipFilename = `bulk_labels_${new Date().toISOString()}.zip`;
    fs.writeFileSync(`../shippingLabels/${email}/${zipFilename}`, zipBuffer);

    await sendLabelOrderCustomerEmail(email, zipBuffer, zipFilename);
    await sendLabelOrderAdminEmail(email, zipBuffer, zipFilename);
    logger(
      `Bulk Label Order PDF email sent successfully to customer and KEMLabels`,
      "info"
    );
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`Error handling bulk label order PDF: ${error}`, "error");
    throw new Error("Error handling bulk label order PDF.");
  }
};

// Create a Bulk Label Order
const createBulkLabels = async (req, res) => {
  try {
    const email = req.body.email;
    const bulkOrderFile = req.file;
    const uuid = "6c66fbee-ef2e-4358-a28b-c9dc6a7eccaf"; // @TODO: Hardcoded UUID

    if (!email || !bulkOrderFile) {
      logger("Bulk Label Order creation failed: Missing data.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again.",
      });
    }

    // Fetch user data from Label API to check if user exists
    const fetchUserResponse = await nodeFetch(process.env.LABEL_API_USER_INFO, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ uuid: uuid }),
    });

    const userData = await fetchUserResponse.json();
    logger(`User data fetched: ${JSON.stringify(userData)}`, "info");
    if (!userData || userData.status !== "success") {
      logger(
        "Bulk Label Order creation failed: Label API User data fetch failed.",
        "error"
      );
      return res.status(500).json({
        msg: userData?.message || "Label API User data fetch failed.",
      });
    }

    // Read the bulk order XLSX file and parse the data
    const parsedData = await parseBulkOrderFile(bulkOrderFile);
    if (
      !parsedData ||
      !parsedData.courier ||
      !parsedData.classType ||
      !parsedData.signature ||
      !parsedData.orders ||
      parsedData.orders.length === 0
    ) {
      logger(
        "Bulk Label Order creation failed: Error parsing bulk order file.",
        "error"
      );
      return res.status(500).json({
        msg: "Error parsing bulk order file.",
      });
    }

    const user = await UserModel.findOne({ email: email });
    if (!user) {
      logger(
        `Bulk Label Order creation failed: User not found for email: ${email}`,
        "error"
      );
      return res.status(404).json({
        msg: "User not found for the given email.",
      });
    }

    // Check if the user has enough credits to create the labels
    const totalPrice =
      user.customPricing[parsedData.courier] * parsedData.orders.length;
    if (user.credits < totalPrice) {
      logger(
        `Bulk Label Order creation failed: Insufficient credits for email: ${email}`,
        "error"
      );
      return res.status(400).json({
        msg: "Insufficient credit balance.",
      });
    }

    // Get country, saturday delivery, and endpoint based on courier
    const labelEndpointData = getLabelEndpointAndOptions(parsedData.courier);
    if (!labelEndpointData || labelEndpointData.status !== "success") {
      logger(
        `Bulk Label Order creation failed: Invalid courier. Courier: ${parsedData.courier}`,
        "error"
      );
      return res.status(400).json({ msg: labelEndpointData.msg });
    }

    const { country, satDelivery, endpoint } = labelEndpointData.data;
    const trackingNumbers = [];
    const pdfBuffers = [];

    // Fetch a label for each order in the bulk order file
    // and store the tracking number and PDF buffer
    for (let i = 0; i < parsedData.orders.length; i++) {
      const order = parsedData.orders[i];
      const fetchLabelResponse = await fetchSingleLabel(
        endpoint,
        uuid,
        order,
        parsedData.signature,
        country,
        satDelivery
      );

      if (!fetchLabelResponse || fetchLabelResponse.status !== "success") {
        logger(
          `Bulk Label Order creation failed: Label API Label fetch failed. API Response: ${JSON.stringify(
            fetchLabelResponse
          )}`,
          "error"
        );
        return res.status(500).json({
          msg: fetchLabelResponse?.message || "Label API Label fetch failed.",
        });
      }

      // Create a shipping label order PDF and store it in a buffer
      const { tracking, label_pdf, receipt_pdf } = fetchLabelResponse.data;
      if (!tracking || !label_pdf || !receipt_pdf) {
        logger(
          `Bulk Label Order creation failed: Missing data in API response. API Response: ${JSON.stringify(
            fetchLabelResponse
          )}`,
          "error"
        );
        return res.status(500).json({ msg: "Internal server error." });
      }

      trackingNumbers.push(tracking);
      pdfBuffers.push(Buffer.from(label_pdf, "base64"));
    }

    if (trackingNumbers.length !== pdfBuffers.length) {
      logger(
        "Bulk Label Order creation failed: Tracking numbers and PDF buffers mismatch.",
        "error"
      );
      return res.status(500).json({ msg: "Internal server error." });
    }
    logger(`Bulk Label Order created successfully.`, "info");

    // Update the user's credit balance in the database
    await updateCreditBalanceDb(email, totalPrice);

    // Handle the bulk order PDF and send it to the user
    await handleBulkOrderPdf(trackingNumbers, pdfBuffers, email);

    return res.status(200).json({
      msg: "Bulk Label Order created successfully.",
    });
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`Error processing Bulk Label Order Request: ${error}`, "error");
    return res.status(500).json({
      msg: err.message || "Internal server error.",
    });
  }
};

// Fetch the sender info from the database
const getSenderInfo = async (req, res) => {
  try {
    const { email } = req.session.user;

    if (!email) {
      logger("Get Sender Info failed: Missing email from session.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again.",
      });
    }

    const user = await UserModel.findOne({ email: email });
    if (!user) {
      logger(
        `Get Sender Info failed: User not found for email: ${email}`,
        "error"
      );
      return res.status(404).json({
        msg: "User not found for the given email.",
      });
    }

    if (!user.senderInfo) {
      logger(
        `Get Sender Info failed: Sender Info not found for email: ${email}`,
        "error"
      );
      return res.status(404).json({ msg: "Sender Info not found." });
    }

    logger(`Sender Info fetched successfully for email: ${email}`, "info");
    return res.status(200).json({ senderInfo: user.senderInfo });
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`Error fetching Sender Info: ${error}`, "error");
    return res.status(500).json({
      msg: err.message || "Internal server error.",
    });
  }
};

// Fetch the user's label pricings from the database
const getLabelPricings = async (req, res) => {
  try {
    const { email } = req.session.user;

    if (!email) {
      logger("Get Label Pricings failed: Missing email from session.", "error");
      return res.status(404).json({
        msg: "An unexpected error occurred. Please try again.",
      });
    }

    const user = await UserModel.findOne({ email: email });
    if (!user) {
      logger(
        `Get Label Pricings failed: User not found for email: ${email}`,
        "error"
      );
      return res.status(404).json({
        msg: "User not found for the given email.",
      });
    }

    logger(`Label Pricings fetched successfully for email: ${email}`, "info");
    return res.status(200).json({ pricing: user.customPricing });
  } catch (err) {
    const error = typeof err === Object ? JSON.stringify(err) : err;
    logger(`Error fetching Label Pricings: ${error}`, "error");
    return res.status(500).json({
      msg: err.message || "Internal server error.",
    });
  }
};

module.exports = {
  createSingleLabel,
  createBulkLabels,
  getSenderInfo,
  getLabelPricings,
};
