//Include Modules
const express = require("express");
const app = express();
const cors = require('cors');
const bcrypt = require("bcryptjs");
const session = require('express-session');
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { format } = require('date-fns');
require('express-async-errors');
const emailTemplate = require('./emailTemplate');
const nodeFetch = require('node-fetch');
const logger = require('./log');
const fs = require('fs');
const csv = require('csv-parser')
const XLSX = require('xlsx');
const multer = require('multer');
const AdmZip = require('adm-zip');

//Configure mongoose, app, and dotenv
mongoose.set('strictQuery', false);
app.set('trust proxy', 1);

//Retrieve API keys from env
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const coinbaseApiKey = process.env.COINBASE_API;

//Initiate payment methods API's
const stripe = require("stripe")(stripeSecretKey);
const coinbase = require('coinbase-commerce-node');
const Client = coinbase.Client;
const resources = coinbase.resources;
const cryptoCharge = resources.Charge;
Client.init(coinbaseApiKey);

// Check hosting enviorment
const isDevelopmentEnv = () => process.env.NODE_ENV === 'development';

//Connect to Mongo and set up MongoDBStore
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger("Connected to DB");
    } catch (error) {
        logger(`Couldn't connect to DB: ${error}`, "error");
        process.exit(1);
    }
}

const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.DB_STRING,
    collection: 'sessions',
});

//Import schema modules
const User = require('./model/users.js');
const tempTokens = require('./model/tempToken.js');
const tempOTPS = require('./model/tempOTPs.js');

//Start app
app.use('/', express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_SERVER);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});
app.use(cors({
    origin: process.env.FRONTEND_SERVER,
    methods: ['POST', 'GET', 'PATCH', 'OPTIONS'],
    credentials: true
}));
function customJsonParser(req, res, next) {
    if ((req.path === '/webhook' && req.method === 'POST') || (req.path === '/crypto/webhook' && req.method === 'POST')) {
        // If the request is for "/webhook" and it's a POST request, skip the JSON parsing
        next();
    } else {
        // For all other requests, use express.json()
        express.json()(req, res, next);
    }
}
app.use(customJsonParser);
app.use(session({
    name: 'sessionID',
    secret: 'strongass',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 600000,
        httpOnly: true,
        secure: !isDevelopmentEnv(),
        sameSite: isDevelopmentEnv() ? null : 'none',
    },
    store: store,
}));


//Set up transporter for nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    // host: 'smtp.gmail.com',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'bulkOrders/')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage: storage })

//Middleware to check inactivity
// app.get("/isSessionActive", (req, res) => {
//     if (req.session && req.session.lastActivityTime) {
//         const currentTime = new Date().getTime();
//         const timeDifference = currentTime - req.session.lastActivityTime;

//         if (timeDifference >= 600000) {
//             // Session is inactive
//             res.status(401).send({ active: false });
//         } else {
//             // Session is active
//             res.status(200).send({ active: true });
//         }
//     } else {
//         // No session
//         res.status(401).send({ active: false });
//     }
// });

//STRIPE API
app.get("/getStripePublicKey", (req, res) => {
    res.json(stripePublicKey);
})

const calculateOrderAmount = (amount) => {
    return Number(amount * 100);
};

app.post("/create-payment-intent", async (req, res) => {
    try {
        // amount is in dollars so convert to cents in paymentIntent
        const { amount, email } = req.body;

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(amount),
            currency: "usd",
            automatic_payment_methods: {
                enabled: false,
            },
            metadata: {
                email: email,
            },
        });
        logger(`PaymentIntent created successfully: ${JSON.stringify(paymentIntent)}`);
        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        logger(`Error creating PaymentIntent: ${err}`, "error");
        res.status(500).send({ error: err.message });
    }
});

app.post('/webhook', express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    logger(`Received webhook payload:' ${JSON.stringify(req.body)}`)

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        logger(`Failed to verify webhook: ${err}`, "error");
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type !== "payment_intent.succeeded") {
        logger(`Webhook received unknown event type: ${event.type}`);
        return res.status(400).end();
    }

    try {
        const paymentIntent = event.data.object;
        logger(`Payment succeeded! Payment Intent: ${paymentIntent}`);
        const user = await User.findOne({ email: paymentIntent.metadata.email })
        if (!user) {
            logger(`User not found for email: ${paymentIntent.metadata.email}`, "error");
            throw new Error('User not found.');
        }

        // paymentIntent.amount is in cents so convert to dollars
        const userExistingCredits = user.credits;
        const newCredits = Number(userExistingCredits) + Number(paymentIntent.amount / 100);
        await User.updateOne({ "_id": user._id.toString() }, { "credits": newCredits });
        logger(`User credits updated. New credits: ${newCredits}`);
    } catch (err) {
        logger(`Error updating user credits: ${err}`, "error");
        res.status(500).end();
    }
    res.status(200).end();
});

//COINBASE API
app.post("/payWithCrypto", async (req, res) => {
    try {
        const { amount, email } = req.body;
        logger(`Initiating crypto payment for amount: ${amount} USD`);

        const charge = await cryptoCharge.create({
            name: "KEMLabels Credit Deposit",
            local_price: {
                amount: amount,
                currency: "USD"
            },
            pricing_type: "fixed_price",
            metadata: {
                email: email
            },
            cancel_url: `${process.env.FRONTEND_SERVER}/load-credits`
        })
        logger(`Crypto payment initiated. Redirecting to hosted URL: ${charge.hosted_url}`);
        res.json({ redirect: charge.hosted_url });
    } catch (err) {
        logger(`Error during crypto payment: ${err}`, "error");
        res.status(500).json({ msg: 'Error during crypto payment.' });
    }
})

app.post('/crypto/webhook', express.raw({ type: "application/json" }), async (req, res) => {
    try {
        const event = coinbase.Webhook.verifyEventBody(
            req.body,
            req.headers['x-cc-webhook-signature'],
            process.env.COINBASE_WEBHOOK_SECRET
        );

        if (event.type === "charge:confirmed" || event.type === "charge:resolved") {
            logger("Payment succeeded!");
            const user = await User.findOne({ email: event.metadata.email })
            if (!user) {
                logger(`User not found for email: ${event.metadata.email}`, "error");
                throw new Error('User not found.');
            }

            // paymentIntent.amount is in cents so convert to dollars
            const userExistingCredits = user.credits;
            const bonusCredit = event.local.amount * 1.1;
            const newCredits = Number(userExistingCredits) + Number(bonusCredit);
            await User.updateOne(
                { "_id": user._id.toString() },
                { "credits": newCredits }
            );
            logger(`User credits updated. New credits: ${newCredits}`);
        }
        res.status(200).end();
    } catch (err) {
        logger(`Failed to verify webhook: ${err}`, "error");
        return res.status(400).json({ msg: "Failed to verify webhook." });
    }
});

//Signing in
app.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body
        const data = {
            email: email,
            password: password
        }
        const emailAddress = data.email.toLowerCase();
        const user = await User.findOne({ email: emailAddress })
        if (!user) {
            logger(`Signin failed: User not found for email '${emailAddress}'.`, "error");
            throw new Error('Incorrect email or password.');
        }

        const comparePass = await bcrypt.compare(password, user.password);
        if (!comparePass) {
            logger(`Signin failed: Incorrect password for user '${emailAddress}'.`, "error")
            throw new Error('Incorrect email or password.');
        }

        req.session.user = user;
        req.session.isLoggedIn = true;
        const userInfo = {
            credits: user.credits,
            userName: user.userName,
            joinedDate: user.createdAt,
        }
        logger(`User '${emailAddress}' signed in successfully.`);
        res.status(200).json({ redirect: '/', userInfo });
    } catch (err) {
        logger(`Error signing in: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

//Logout
app.get('/logout', (req, res) => {
    try {
        req.session.destroy();
        logger('User logged out successfully.');
        return res.json({ redirect: '/' })
    } catch (err) {
        logger(`Error during logout: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

//Signing up
app.post("/signup", async (req, res) => {
    try {
        const { userName, email, password } = req.body

        const data = {
            userName: userName.toLowerCase(),
            email: email.toLowerCase(),
            password: password
        }

        const userNameExists = await User.findOne({ userName: data.userName })
        if (userNameExists) {
            logger(`Signup failed: Username '${userName}' is already associated with an account.`, "error");
            throw new Error('This username is already associated with an account.');
        }

        const emailExists = await User.findOne({ email: data.email })
        if (emailExists) {
            logger(`Signup failed: Email '${email}' is already associated with an account.`, "error");
            throw new Error('This email is already associated with an account.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        const new_user = new User({
            userName: data.userName,
            email: data.email,
            password: hashedPassword,
        });
        await new_user.save()
        logger(`New user created: ID '${new_user._id}', Username '${new_user.userName}', Email '${new_user.email}'`);

        const token = crypto.randomBytes(32).toString("hex");
        const create_token = new tempTokens({
            token: token,
            userid: new_user._id
        })
        await create_token.save()
        logger(`Verification token created and saved for user ID '${new_user._id}'`);

        const url = `${process.env.FRONTEND_SERVER}/users/${new_user._id}/verify/${token}`;
        logger(`Verification URL generated: ${url}`);
        await sendSignUpConfirmationEmail(data.email, url);

        req.session.user = new_user;
        req.session.isLoggedIn = true;
        res.status(200).json({ redirect: '/verify-email' });
    } catch (err) {
        logger(`Error signing up: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

//Email verification
app.get("/generateToken", async (req, res) => {
    try {
        const findToken = await tempTokens.findOne({ userid: req.session.user._id.toString() });
        if (findToken) {
            await tempTokens.deleteOne({ _id: findToken._id.toString() });
            logger('Token successfully deleted');
        }
        await generateTokenHelper(req.session.user._id, req.session.user.email);
        res.status(200).send("Token generated successfully");
    } catch (err) {
        logger(`Error generating token: ${err}`, "error");
        res.status(500).send("An error occurred while generating the token.");
    }
})

async function generateTokenHelper(userID, email) {
    try {
        const token = crypto.randomBytes(32).toString("hex");
        const create_token = new tempTokens({
            token: token,
            userid: userID
        })
        await create_token.save()
        const url = `${process.env.FRONTEND_SERVER}/users/${userID}/verify/${token}`;
        logger(`URL for email verification: ${url}`)
        await sendSignUpConfirmationEmail(email, url);
    } catch (err) {
        logger(`Error generating token and sending confirmation email: ${err}`, "error");
    }
}

async function sendSignUpConfirmationEmail(emailAddress, url) {
    try {
        const content = `<p>Thank you for signing up with us!</p>
        <p>Please use the following <a href="${url}" target="_blank" style="color:#0066ff!important;text-decoration:none">link here</a> to confirm your email address.</p>
        <p>If you did not sign up for KEMLabels, you can safely ignore this email.</p>
        <p>Have any questions? Please contact us at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
        const signUpConfirmationEmail = emailTemplate(emailAddress, 'KEMLabels - Confirm Your Email', content);
        transporter.sendMail(signUpConfirmationEmail, function (err, info) {
            if (err) logger(`Error sending signup confirmation email: ${err}`, "error");
            else logger(`Signup confirmation email sent successfully to ${emailAddress}.`);
        });
    } catch (err) {
        logger(`Error sending email for signup confirmation: ${err}`, "error");
    }
}

app.get('/users/:id/verify/:token', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (!user) {
            logger(`User not found for verification: ${user}`, "error");
            throw new Error('Link Invalid');
        }

        const token = await tempTokens.findOne({ token: req.params.token });
        if (!token) {
            const previoustoken = await tempTokens.findOne({ userid: req.params.id })
            if (previoustoken) {
                if (previoustoken.token !== req.params.token) {
                    logger(`Link Expired for user: ${req.params.id}`, "error");
                    throw new Error('Link Expired');
                }
            } else {
                logger(`Link Invalid for user: ${req.params.id}`, "error");
                throw new Error('Link Invalid');
            }
        }

        // Update user verification status
        await User.updateOne({ "_id": user._id.toString() }, { "verified": true });
        logger(`User has been verified: ${user._id}`);

        // Delete the verification token
        await tempTokens.deleteOne({ token: req.params.token });
        logger(`Verification token successfully deleted: ${req.params.token}`);

        return res.status(200).json({ redirect: '/' });
    } catch (err) {
        logger(`Error verifying user: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

app.get('/isUserVerified', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) {
            logger(`User not found for session user ID: ${req.session.user._id}`, "error");
            throw new Error('An error occurred.');
        }

        const verified = user.verified;
        if (!verified) {
            logger(`User is not verified: ${user}`, "error");
            throw new Error('Please check your inbox for a verification link to verify your account.');
        }

        logger(`User is verified: ${user}`);
        res.status(200).json({ redirect: '/' });
    } catch (err) {
        logger(`Error checking user verification: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

app.get('/checkVerification', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) {
            logger(`User not found for session user ID: ${req.session.user._id}`, "error");
            throw new Error('An error occurred.');
        }

        const verified = user.verified;
        if (!verified) {
            logger(`User is not verified: ${user}`, "error");
            throw new Error('User is not verified');
        }

        logger(`User is verified: ${user}`);
        res.status(200).json({ redirect: '/' });
    } catch (err) {
        logger(`Error checking user verification: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

//Forgot password
app.post("/emailExists", async (req, res) => {
    try {
        const data = { email: req.body.email.toLowerCase() }
        const user = await User.findOne({ email: data.email })
        if (!user) {
            logger(`Email not found for: ${data.email}`, "error");
            throw new Error('Hmm... this email is not associated with an account. Please try again.');
        }

        logger(`Email found for: ${data.email}`);
        res.status(200).json({ user });
    } catch (err) {
        logger(`Error checking if email exists: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

app.post("/forgotpassword", async (req, res) => {
    try {
        const { email, type } = req.body
        if (!email) return res.status(400).json({ msg: 'Invalid email provided.' });
        generateOTPHelper(email, type);
        res.status(200).json({ msg: 'OTP generated successfully.' });
    } catch (err) {
        logger(`Error generating OTP for Forgot Password: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

app.post("/generateNewOTP", async (req, res) => {
    try {
        const { email, type } = req.body
        const existingOTP = await tempOTPS.findOneAndDelete({ email: email.toLowerCase() });

        if (existingOTP) logger(`Existing OTP record found and deleted: ${existingOTP}`);
        else logger('No existing OTP record found.');

        // Generate a new OTP and send the email
        generateOTPHelper(email, type);
        res.status(200).json({ msg: 'New OTP generated successfully.' });
    } catch (err) {
        logger(`Error generating new OTP: ${err}`, "error");
        return res.status(500).json({ msg: err.message });
    }
})

async function generateOTPHelper(email, type) {
    try {
        const otp = Math.floor(1000 + Math.random() * 9000);
        const create_OTP = new tempOTPS({ passcode: otp, email: email })
        await create_OTP.save()
        sendOTPEmail(otp, email, type);
    } catch (err) {
        logger(`Error generating OTP: ${err}`, "error");
    }
}

function sendOTPEmail(OTPPasscode, emailAddress, type) {
    const resetPasswordContent = `<p>We received a request to reset the password associated with your account.</p>
    <p>To confirm your email address, please enter the 4 digit code below.</p>
    <div style="margin: 2rem; text-align: center;"><h1 style="letter-spacing: 5px">${OTPPasscode}</h1></div>
    <p>If you did not initiate this request, you can safely ignore this email or let us know.</p>
    <p>Have any questions? Please contact us at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
    const resetPasswordOTPEmail = emailTemplate(emailAddress, 'KEMLabels - Your Verification Code to Reset Password', resetPasswordContent);

    const changePasswordContent = `<p>We received a request to change the password associated with your account.</p>
    <p>To confirm your email address, please enter the 4 digit code below.</p>
    <div style="margin: 2rem; text-align: center;"><h1 style="letter-spacing: 5px">${OTPPasscode}</h1></div>
    <p>If you did not initiate this request, you can safely ignore this email or let us know.</p>
    <p>Have any questions? Please contact us at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
    const changePasswordOTPEmail = emailTemplate(emailAddress, 'KEMLabels - Your Verification Code to Change Password', changePasswordContent);

    const changeEmailContent = `<p>We received a request to change the email associated with your account.</p>
    <p>To confirm your new email address, please enter the 4 digit code below.</p>
    <div style="margin: 2rem; text-align: center;"><h1 style="letter-spacing: 5px">${OTPPasscode}</h1></div>
    <p>If you did not initiate this request, you can safely ignore this email or let us know.</p>
    <p>Have any questions? Please contact us at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
    const changeEmailOTPEmail = emailTemplate(emailAddress, 'KEMLabels - Your Verification Code to Change Email Address', changeEmailContent);

    const emailTypes = {
        'resetPassword': resetPasswordOTPEmail,
        'changePassword': changePasswordOTPEmail,
        'changeEmail': changeEmailOTPEmail,
    };

    const selectedEmail = emailTypes[type];
    if (selectedEmail) {
        transporter.sendMail(selectedEmail, function (err, info) {
            if (err) logger(`Error sending OTP email for type ${type}: ${err}`, "error");
            else logger(`OTP email for type ${type} sent successfully to '${emailAddress}'.`);
        });
    } else logger(`Error in sendOTPEmail: ${error}`, "error");
}

app.post("/checkOTP", async (req, res) => {
    try {
        const { enteredOTP, email } = req.body
        logger(`OTP verification initiated for email: ${email}`);
        logger(`Entered OTP: ${enteredOTP}`);

        const tempCode = await tempOTPS.findOneAndDelete({ email: email.toLowerCase() });

        if (!tempCode) {
            logger('OTP verification failed: Invalid code or expired session.', "error");
            throw new Error("Invalid Code");
        }
        logger(`Correct OTP retrieved from the database: ${tempCode.passcode}`);

        if (Number(enteredOTP) !== Number(tempCode.passcode)) {
            logger('OTP verification failed: Incorrect code entered.', "error");
            throw new Error('Hmm... your code was incorrect. Please try again.');
        }
        logger(`OTP verification successful. Deleted record for code: ${enteredOTP}`);

        res.status(200).json("success");
    } catch (err) {
        logger(`Error during OTP verification: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }

})

app.post("/updateUserPass", async (req, res) => {
    try {
        const { email, password } = req.body

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = await User.findOne({ email: email.toLowerCase() })
        if (!userData) {
            logger(`User not found for email '${email}' during password update.`, "error");
            throw new Error("An unexpected error occurred. Please try again later.");
        }

        await User.updateOne(
            { "_id": userData._id.toString() },
            { "password": hashedPassword }
        );
        logger(`Password updated successfully for user '${email}'`);

        sendPasswordChangeEmail(email);
        logger(`Password change notification email sent successfully to '${email}'.`);

        res.json({ redirect: '/signin' });
    } catch (err) {
        logger(`Error updating user password: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

function sendPasswordChangeEmail(emailAddress) {
    try {
        const content = `<h1 style="margin-bottom: 2rem;">Did you change your password?</h1>
        <p>We noticed the password for your KEMLabels' account was recently changed. If this was you, rest assured that your new password is now in effect. No further action is required and you can safely ignore this email.</p>
        <p>However, if you did not request this change, please contact our support team immediately at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
        const changePassConfirmation = emailTemplate(emailAddress, 'KEMLabels Security Alert - Your Password Has Been Updated', content);

        transporter.sendMail(changePassConfirmation, function (err, info) {
            if (err) logger(`Error sending password change email: ${err}`, "error");
            else logger(`Password change email sent successfully to ${emailAddress}.`);
        });
    } catch (err) {
        logger(`Error sending email for updating password: ${err}`, "error");
    }
}

async function getStripePayemnts(email) {
    logger(`Fetching Stripe payments for user: ${email}`)
    try {
        const paymentIntent = await stripe.paymentIntents.search({
            query: `status:\'succeeded\' AND metadata[\'email\']:\'${email}\'`,
            limit: 100,
        });
        logger(`Fetched ${paymentIntent.data.length} payment intents`);

        const paymentIntents = [];

        for (const intent of paymentIntent.data) {
            const createdTimestamp = intent.created;
            const createdDate = format(new Date(createdTimestamp * 1000), 'MMMM dd, yyyy');
            const createdTime = format(new Date(createdTimestamp * 1000), 'hh:mm a');
            const statusMapping = {
                succeeded: 'Success',
                processing: 'Processing',
            };

            paymentIntents.push({
                refId: intent.id,
                paymentDate: createdDate,
                paymentTime: createdTime,
                amount: intent.amount / 100, // convert to dollars
                type: 'Credit Card',
                status: statusMapping[intent.status] || 'Failed',
            });
        }
        logger(`Stripe payments fetched size: ${paymentIntents.length}, ${JSON.stringify(paymentIntents)}`)
        return paymentIntents;
    } catch (err) {
        logger(`Error fetching Stripe payments: ${err}`, "error");
        return [];
    }
}

async function getCoinbasePayments(email) {
    logger(`Fetching Coinbase payments for user: ${email}`)
    try {
        const chargeList = await cryptoCharge.list({}, (error, list, pagination) => {
            if (error) {
                logger(`Crypto charge fetch error: ${error}`, "error");
                return [];
            }
        });
        const userCharge = chargeList[0].filter(charge => charge.metadata.email === email);
        if (!userCharge) {
            logger(`No payments found for user: ${email}`);
            return [];
        }
        logger(`Fetched crypto charge: ${JSON.stringify(userCharge)}`);

        const payments = [];
        for (const charge of userCharge) {
            const statusMapping = {
                created: 'Processing',
                pending: 'Processing',
                confirmed: 'Success',
            };

            for (const payment of charge.payments) {
                const createdTimestamp = payment.detected_at;
                const createdDate = format(new Date(createdTimestamp), 'MMMM dd, yyyy');
                const createdTime = format(new Date(createdTimestamp), 'hh:mm a');
                payments.push({
                    refId: payment.payment_id,
                    paymentDate: createdDate,
                    paymentTime: createdTime,
                    amount: payment.value.local.amount,
                    type: 'Crypto',
                    status: statusMapping[payment.status.toLowerCase()] || 'Failed',
                });
            }
        }
        logger(`Coinbase payments fetched size: ${payments.length}, ${JSON.stringify(payments)}`)
        return payments;
    } catch (err) {
        logger(`Error fetching Coinbase payments: ${err}`, "error");
        return [];
    }
}

//Credit history
app.post('/getCreditHistory', async (req, res) => {
    try {
        const { email } = req.body;
        logger(`Received request to fetch credit history for user: ${email}`);

        const payments = [];
        const stripePayments = await getStripePayemnts(email);
        if (stripePayments) payments.push(...stripePayments);
        const coinbasePayments = await getCoinbasePayments(email);
        if (coinbasePayments) payments.push(...coinbasePayments);

        // Sort the payments by date and time
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

        logger(`Formatted payments: ${JSON.stringify(payments)}`);
        res.send(payments);
    } catch (err) {
        logger(`Error fetching credit history: ${err}`, "error");
        res.status(400).send('An error occurred while fetching credit history.');
    }
})

//Username Change
app.post("/UpdateUsername", async (req, res) => {
    try {
        const { userName } = req.body;
        const userNameData = userName.toLowerCase();
        logger(`Received request to update username to ${userNameData}.`);

        // Retrieve the user from the session
        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) {
            logger('User not found during username update.', "error");
            throw new Error("An unexpected error occurred. Please try again later.");
        }

        const currentDate = new Date();
        if (user.userNameLastChanged) {
            // Calculate the time difference in hours and minutes
            const timeDiff = Math.abs(currentDate - user.userNameLastChanged);
            const hoursPassed = Math.floor(timeDiff / 3600000);
            const minutesPassed = Math.floor((timeDiff % 3600000) / 60000);

            const remainingHours = 24 - hoursPassed;
            const remainingMinutes = 60 - minutesPassed;

            if (remainingHours > 0 || (remainingHours === 0 && remainingMinutes > 0)) {
                logger(`Username change request failed: User must wait ${remainingHours} hours and ${remainingMinutes} minutes to change their username.`, "error");
                if (remainingHours === 24) throw new Error(`You must wait ${remainingHours} hours before you can change your username again.`);
                else throw new Error(`You must wait ${remainingHours} hours and ${remainingMinutes} minutes before you can change your username again.`);
            }
        }

        if (userNameData === user.userName) {
            logger('Username change request failed: New username is the same as the current username.', "error");
            throw new Error("You cannot change your username to the same one you currently have.");
        }

        // Check if the new username is already used by another user
        const userNameAlreadyUsed = await User.findOne({ userName: userNameData });
        if (userNameAlreadyUsed) {
            logger('Username change request failed: New username is already associated with another account.', "error");
            throw new Error("This username is already associated with an account.");
        }

        // Update the username and userNameLastChanged
        await User.updateOne(
            { "_id": user._id.toString() },
            { "userName": userNameData, "userNameLastChanged": currentDate }
        );
        logger(`Username updated successfully to ${userNameData}.`);

        sendUserNameChangeEmail(user.email);
        logger(`Username change email sent successfully to ${user.email}.`);
        return res.status(200).json({ msg: 'Username updated successfully.' });
    } catch (err) {
        logger(`Error updating username: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
});

function sendUserNameChangeEmail(emailAddress) {
    try {
        const content = `<h1 style="margin-bottom: 2rem;">Did you change your username?</h1>
        <p>We noticed the username for your KEMLabels' account was recently changed. If this was you, rest assured that your new username is now in effect. No further action is required and you can safely ignore this email.</p>
        <p>However, if you did not request this change, please contact our support team immediately at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
        const sendOneTimePasscodeEmail = emailTemplate(emailAddress, 'KEMLabels Security Alert - Your Username Has Been Updated', content);

        transporter.sendMail(sendOneTimePasscodeEmail, function (err, info) {
            if (err) logger(`Error sending username change email: ${err}`, "error");
            else logger(`Username change email sent successfully to ${emailAddress}.`);
        });
    } catch (err) {
        logger(`Error sending email for updating username: ${err}`);
    }
}

//Email Change
app.post("/sendEmailChangeConfirmation", async (req, res) => {
    try {
        const { newEmail } = req.body
        const currentEmail = req.session.user.email;
        logger(`Received request to change email from ${currentEmail} to ${newEmail.toLowerCase()}.`);

        if (newEmail.toLowerCase() === currentEmail) {
            logger('Email change request failed: New email is the same as the current email.', "error");
            throw new Error("You cannot change your email to the one you currently have.");
        }

        // Check if the new email is already used by another user
        const emailAlreadyUsed = await User.findOne({ email: newEmail.toLowerCase() });
        if (emailAlreadyUsed) {
            logger('Email change request failed: New email is already associated with another account.', "error");
            throw new Error("This email is already associated with an account.");
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        const create_OTP = new tempOTPS({ passcode: otp, email: newEmail })
        await create_OTP.save()
        logger(`Generated OTP ${otp} for email change confirmation.`);

        sendEmailChangeRequestEmail(currentEmail, newEmail.toLowerCase(), otp)
        logger(`Email change confirmation sent successfully to ${newEmail.toLowerCase()}.`);
        return res.status(200).json({ msg: `A confirmation email with instructions has been sent to ${newEmail.toLowerCase()}.` });
    } catch (err) {
        logger(`Error processing email change confirmation: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

function sendEmailChangeRequestEmail(currentEmail, newEmail, OTPPasscode) {
    try {
        const content = `<h1 style="margin-bottom: 2rem;">Did you change your email?</h1>
        <p>We received a request to change the email associated with your account. If this was you, you can safely ignore this email.</p>
        <p>However, if you did not request this change, please contact our support team immediately at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
        const sendSecurityAlert = emailTemplate(currentEmail, 'KEMLabels Security Alert - Email Change Detected on Your Account', content);

        transporter.sendMail(sendSecurityAlert, function (err, info) {
            if (err) logger(`Error sending security alert email for updating email: ${err}`, "error");
            else logger(`Security alert email sent successfully to ${currentEmail}.`);
        });
        sendOTPEmail(OTPPasscode, newEmail, "changeEmail");
        logger(`OTP email sent successfully to ${newEmail}.`);
    } catch (err) {
        logger(`Error sending email for updating email: ${err}`, "error");
    }
}

app.post("/updateEmailAddress", async (req, res) => {
    try {
        const { newEmail } = req.body;
        logger(`Received request to update email address to ${newEmail}.`);

        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) {
            logger('User not found during email update: /updateEmailAddress.', "error");
            throw new Error("An unexpected error occurred. Please try again later.");
        }

        await User.updateOne(
            { "_id": user._id.toString() },
            { "email": newEmail.toLowerCase(), "verified": false }
        );
        logger(`Updated email to ${newEmail} and set user as unverified.`);

        sendEmailChangeEmail(newEmail.toLowerCase());
        logger(`Email change notification email sent successfully to ${newEmail.toLowerCase()}.`);
        return res.status(200).json({ msg: 'Email address updated successfully.' });
    } catch (err) {
        logger(`Error updating email address: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

function sendEmailChangeEmail(emailAddress) {
    try {
        const content = `<h1 style="margin-bottom: 2rem;">Did you change your email?</h1>
        <p>We noticed the email for your KEMLabels' account was recently changed. If this was you, rest assured that your new email is now in effect. No further action is required and you can safely ignore this email.</p>
        <p>However, if you did not request this change, please contact our support team immediately at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
        const sendOneTimePasscodeEmail = emailTemplate(emailAddress, 'KEMLabels Security Alert - Your Email Has Been Updated', content);

        transporter.sendMail(sendOneTimePasscodeEmail, function (err, info) {
            if (err) logger(`Error sending email: ${err}`, "error");
            else logger(`Email sent successfully to ${emailAddress}.`);
        });
    } catch (err) {
        logger(`Error sending email for updating email: ${err}`, "error");
    }
}

//Password Change
app.post("/sendPasswordChangeConfirmation", async (req, res) => {
    try {
        const { enteredPassword, newPassword } = req.body;
        const currentPassword = req.session.user.password;
        logger('Received request for password change confirmation.');

        const comparePassword = await bcrypt.compare(enteredPassword, currentPassword);
        if (!comparePassword) {
            logger('Entered password does not match the current password.', "error");
            throw new Error("Hmm... your current password is incorrect. Please try again.");
        }

        const comparePassWithNewPass = await bcrypt.compare(newPassword, currentPassword);
        if (comparePassWithNewPass) {
            logger('Entered password is the same as the current password.', "error");
            throw new Error("Looks like you have entered the same password that you are using now. Please enter a differernt password.");
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        const userEmail = req.session.user.email;
        logger(`Generated OTP ${otp} for user ${userEmail}.`);

        const create_OTP = new tempOTPS({ passcode: otp, email: userEmail })
        await create_OTP.save();
        sendOTPEmail(otp, userEmail, "changePassword");
        return res.status(200).json({ msg: `A confirmation email with instructions has been sent to ${userEmail}.` });
    } catch (err) {
        logger(`Error processing password change confirmation: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
});

function sendLabelInfoEmail(email, pdfContent, filename) {
    try {
        const attachments = [
            {
                filename: 'shipping_label.pdf',
                path: `./order_label_pdf/${filename}`,
                content: pdfContent
            }
        ];

        // Customer email content
        const customerContent = `<h1 style="margin-bottom: 2rem;">Thank you for you order!</h1>
        <p>Your order has been received and we have attached your shipping label in a PDF attachment to this email.</p>
        <p>For any questions or concerns, please contact our support team at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
        const customerOrderConfirm = emailTemplate(email, 'KEMLabels - Your Shipping Label Order is Ready', customerContent, attachments);

        transporter.sendMail(customerOrderConfirm, (err, info) => {
            if (err) logger(`Error sending shipping label order confirmation to customer: ${err}`, "error");
            else logger(`Shipping label order confirmation email sent successfully to ${email}.`);
        });

        // KEMLabels email content
        const kemContent = `<h1 style="margin-bottom: 2rem;">New Shipping Label Order</h1>
        <p>A new shipping label order has been placed by ${email}. The shipping label has been attached to this email.</p>`;
        const kemlabelsOrderConfirm = emailTemplate(process.env.MAIL_USER, 'KEMLabels - New Shipping Label Order', kemContent, attachments);

        transporter.sendMail(kemlabelsOrderConfirm, (err, info) => {
            if (err) logger(`Error sending shipping label order confirmation to KEMLabels: ${err}`, "error");
            else logger(`Shipping label order confirmation email sent successfully to KEMLabels.`);
        });
    } catch (err) {
        logger(`Error sending email for updating email: ${err}`, "error");
    }
}

//Get the user's sender information
app.post("/getUserSenderInfo", async (req, res) => {
    const { userEmail } = req.body;
    try {
        const user = await User.findOne({ userEmail: userEmail })
        if (!user) {
            logger(`User not found for email: ${email}`, "error");
            throw new Error('User not found.');
        }
        res.send(user.senderInfo);
    } catch (error) {
        logger(`Error processing request: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
});

//Get the user's custom pricing
app.post("/getUserLabelPricings", async (req, res) => {
    const { email } = req.body;
    logger(`Received request to fetch custom pricing for user: ${email}`);
    try {
        const user = await User.findOne({ email: email })
        if (!user) {
            logger(`User not found for email: ${email}`, "error");
            throw new Error('User not found.');
        }
        res.send(user.customPricing);
    } catch (error) {
        logger(`Error processing request: ${error}`, "error");
        return res.status(400).json({ msg: error.message });
    }
});

// Updates the user's credits in the database
async function updateUserCredits(email, totalPrice) {
    try {
        const user = await User.findOne({ email: email })
        if (!user) {
            logger(`updateCredits: User not found for email: ${email}`, "error");
            throw new Error('User not found.');
        }

        console.log(totalPrice);
        const updatedCredits = Number(user.credits) - Number(totalPrice);
        console.log(updatedCredits);
        const res = await User.updateOne({ "_id": user._id.toString() }, { "credits": updatedCredits });
        if (!res) {
            logger(`Error updating user credits: ${err}`, "error");
            throw new Error('Error updating user credits.');
        }
        logger(`User credits updated balance: ${updatedCredits}`);
    } catch (error) {
        logger(`Error updating user credits: ${err}`, "error");
        res.status(500).end();
    }
}

// Saves the user's sender information to the database
async function senderInfoUpdateDB(email, formValues) {
    try {
        const { senderInfo } = formValues;
        const user = await User.findOne({ email: email })
        if (!user) {
            logger(`senderInfo: User not found for email: ${email}`, "error");
            throw new Error('User not found.');
        }
        const updateSenderInfo = await user.updateOne(
            { "senderInfo.name": `${senderInfo.firstName} ${senderInfo.lastName}` },
            { "senderInfo.address1": senderInfo.street },
            { "senderInfo.address2": senderInfo.suite },
            { "senderInfo.city": senderInfo.city },
            { "senderInfo.state": senderInfo.state },
            { "senderInfo.postal_code": senderInfo.zip },
            { "senderInfo.phone": senderInfo.phone },
            { "senderInfo.country": senderInfo.country },
        );
        if (!updateSenderInfo) {
            logger("Error updating user senderInfo", "error");
            throw new Error('Error updating user senderInfo.');
        }
        logger("User sender information updated successfully.");
    } catch (error) {
        logger(`Error updating user credits: ${error}`, "error");
        res.status(500).end();
    }
}

// Handle the shipping label PDF
function handleLabelPDF(tracking, labelPDF, email) {
    const filename = `${tracking}_shipping_label.pdf`;
    try {
        const decodedLabelPDF = Buffer.from(labelPDF, 'base64');
        if (!fs.existsSync('./order_label_pdf')) fs.mkdirSync('./order_label_pdf');
        if (fs.existsSync(`./order_label_pdf/${filename}`)) fs.unlinkSync(`./order_label_pdf/${filename}`);
        fs.writeFileSync(`./order_label_pdf/${filename}`, decodedLabelPDF);
        logger(`Shipping label PDF saved successfully for tracking number: ${tracking}`);

        // Send email to customer and KEMLabels
        sendLabelInfoEmail(email, decodedLabelPDF, filename);
    } catch (err) {
        logger(`Error handling shipping label PDF: ${err}`, "error");
    }
}

//Create single label order
async function createLabel(endpoint, uuid, formValues, signature, country = null, satDelivery = null) {
    const { courier, senderInfo, recipientInfo, packageInfo } = formValues;
    const references = [];
    let classType = formValues.classType;
    if (packageInfo.referenceNumber) references.push(packageInfo.referenceNumber);
    if (packageInfo.referenceNumber2) references.push(packageInfo.referenceNumber2);
    if (signature) classType = classType.split(':')[0] + ' Signature';
    else classType = classType.split(':')[0];

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
            length: packageInfo.length,
            width: packageInfo.width,
            height: packageInfo.height,
            weight: packageInfo.weight,
            description: packageInfo.description,
            references: references,
        }
    }

    // Optional fields
    if (satDelivery) body.package.saturday_delivery = satDelivery;
    if (country) body.country = country;

    logger(`Create Label Request: ${JSON.stringify(body)}`);
    const res = await nodeFetch(
        endpoint,
        {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify(body)
        }
    )
    return res.json();
}

// Order Label for single order
app.post("/orderLabel", async (req, res) => {
    try {
        logger("Received orderLabel request.");
        const uuid = "6c66fbee-ef2e-4358-a28b-c9dc6a7eccaf";
        const { email, totalPrice, formValues, signature, saveSenderInfo } = req.body;
        logger(`Email: ${email}, Total Amount: ${totalPrice}, Form Values: ${JSON.stringify(formValues)}`);

        const labelResponse = await nodeFetch(
            process.env.API_LABELS_USER_INFO,
            {
                headers: { "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({ "uuid": uuid })
            }
        );
        const userInfo = await labelResponse.json();
        logger(`User info: ${JSON.stringify(userInfo)}`);
        if (!userInfo || userInfo.status !== "success") {
            logger(`API Error - User Info: ${userInfo.status}, ${userInfo.message}`, "error");
            throw new Error(userInfo.message);
        }

        let country = null;
        let satDelivery = null;
        let endpoint = null;
        switch (formValues.courier) {
            case "UPS USA":
                country = "US";
                satDelivery = false;
                endpoint = process.env.API_LABELS_ORDER_CREATE_UPS;
                break;
            case "UPS CA":
                country = "CA";
                satDelivery = false;
                endpoint = process.env.API_LABELS_ORDER_CREATE_UPS;
                break;
            case "USPS":
                endpoint = process.env.API_LABELS_ORDER_CREATE_USPS;
                break;
            default:
                break;
        }

        try {
            // Create label
            const labelRes = await createLabel(endpoint, uuid, formValues, signature, country, satDelivery);
            logger(`Create Label Response: ${labelRes.message}`);
            if (!labelRes || labelRes.status !== "success") {
                logger(`API Error - Create Label: ${labelRes.status}, ${labelRes.message}`, "error");
                throw new Error(labelRes.message);
            }

            // Update user credits and sender info
            if (saveSenderInfo) await senderInfoUpdateDB(email, formValues);
            await updateUserCredits(email, totalPrice);

            console.log('labelRes.data: ' + labelRes.data);
            // Handle the shipping label PDF
            const { tracking, label_pdf, receipt_pdf } = labelRes.data;
            handleLabelPDF(tracking, label_pdf, email);
        } catch (err) {
            logger(`Error creating label: ${err.message}`, "error");
            throw new Error(err);
        }
        return res.status(200).json({ msg: "OrderLabel request processed successfully." });
    } catch (err) {
        logger(`Error processing orderLabel request: ${err?.message || err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

// Bulk orders
app.post("/orderLabelBulk", upload.single('file'), async (req, res) => {
    try {
        logger("Received orderLabelBulk request.");
        const uuid = "6c66fbee-ef2e-4358-a28b-c9dc6a7eccaf";
        const { email } = req.body;
        const bulkOrderFile = req.file;
        logger(`Email: ${email}, Bulk Order File: ${JSON.stringify(bulkOrderFile)}`);

        const user = User.findOne({ email: email })
        if (!user) {
            logger(`User not found for email: ${email}`, "error");
            throw new Error('User not found.');
        }
        let clientsPrice = user.customPricing;

        if (!bulkOrderFile) {
            logger("No file uploaded.", "error");
            throw new Error("No file uploaded.");
        }

        const labelResponse = await nodeFetch(
            process.env.API_LABELS_USER_INFO,
            {
                headers: { "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({ "uuid": uuid })
            }
        );
        const userInfo = await labelResponse.json();
        logger(`User info: ${JSON.stringify(userInfo)}`);
        if (!userInfo || userInfo.status !== "success") {
            logger(`API Error - User Info: ${userInfo.status}, ${userInfo.message}`, "error");
            throw new Error(userInfo.message);
        }

        let country, satDelivery, endpoint, finalData, totalPrice = null;
        // TODO: call function to read xsls file

        console.log(finalData);
        totalPrice = clientsPrice * finalData.totalLabels;
        // TODO: match the label price from client to the one from the bulk order
        
        if(user.credits < totalPrice) {
            logger('Insufficient balance');
            throw new Error("Insufficient balance.");
        }

        switch (finalData.courier) {
            case "UPS USA":
                country = "US";
                satDelivery = false;
                endpoint = process.env.API_LABELS_ORDER_CREATE_UPS;
                break;
            case "UPS CA":
                country = "CA";
                satDelivery = false;
                endpoint = process.env.API_LABELS_ORDER_CREATE_UPS;
                break;
            case "USPS":
                endpoint = process.env.API_LABELS_ORDER_CREATE_USPS;
                break;
            default:
                break;
        }

        try {
            const createdPDFs = [];
            return new Promise(async (resolve) => {
                for (let i = 0; i < finalData.length; i++) {
                    const labelData = finalData[i];
                    const labelRes = await createLabelBulk(endpoint, uuid, labelData, country, satDelivery);
                    logger(`Label Response for row ${i + 1}: ${JSON.stringify(labelRes)}`);
                    if (!labelRes || labelRes.status !== "success") {
                        logger(`API Error - Create Label: ${labelRes.status}, ${labelRes.message}`, "error");
                        throw new Error(labelRes.message);
                    }
                    const { tracking, label_pdf, receipt_pdf } = labelRes.data;
                    const filename = handleLabelPDFBulk(tracking, i, label_pdf, email);
                    createdPDFs.push(filename);
                }
                resolve(res.status(200).json({ msg: "OrderLabel request processed successfully." }));
            }).then( (result) =>{
                updateUserCredits(email, totalPrice);
                pdfToZipFile(createdPDFs, email);
            })
        } catch (error) {
            logger(`Error creating label: ${err.message}`, "error");
            throw new Error(err);
        }

    } catch (error) {
        logger(`Error processing orderLabelBulk request: ${err}`, "error");
        return res.status(400).json({ msg: err.message });
    }
})

async function createLabelBulk(endpoint, uuid, finalData, country = null, satDelivery = null) {
    const { courier, senderInfo, recipientInfo, packageInfo } = finalData;
    const references = [];
    let classType = finalData.serviceSpeed;
    if (finalData.signatureRequest === "YES") classType = classType.split(':')[0] + ' Signature';
    else classType = classType.split(':')[0];


    //make dynamic per row
    if (packageInfo.referenceNumber) references.push(packageInfo.referenceNumber);
    if (packageInfo.referenceNumber2) references.push(packageInfo.referenceNumber2);

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
            length: packageInfo.length,
            width: packageInfo.width,
            height: packageInfo.height,
            weight: packageInfo.weight,
            description: packageInfo.description,
            references: references,
        }
    }

    // Optional fields
    if (satDelivery) body.package.saturday_delivery = satDelivery;
    if (country) body.country = country;

    logger(`Create Label Request: ${JSON.stringify(body)}`);
    const res = await nodeFetch(
        endpoint,
        {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify(body)
        }
    )
    return res.json();
}

function handleLabelPDFBulk(tracking, labelPDF, email) {
    const filename = `${tracking}_shipping_label_.pdf`;
    try {
        const decodedLabelPDF = Buffer.from(labelPDF, 'base64');
        if (!fs.existsSync('./order_label_pdf')) fs.mkdirSync('./order_label_pdf');
        if (fs.existsSync(`./order_label_pdf/${filename}`)) fs.unlinkSync(`./order_label_pdf/${filename}`);
        fs.writeFileSync(`./order_label_pdf/${filename}`, decodedLabelPDF);
        logger(`Shipping label PDF saved successfully for tracking number: ${tracking}`);
        return filename;
    } catch (err) {
        logger(`Error handling shipping label PDF: ${err}`, "error");
        return null;
    }
}

function pdfToZipFile(pdfFiles, email) {
    const zip = new AdmZip();

    pdfFiles.forEach((pdfFile) => {
        zip.addLocalFile(`./order_label_pdf/${pdfFile}`);
    });

    const currentDate = new Date();
    zip.writeZip(`./order_label_pdf/${email}_${currentDate}.zip`);
    const filename = `${email}_${currentDate}.zip`;

    sendLabelInfoEmailBulk(email, filename);
}

function sendLabelInfoEmailBulk(email, filename) {
    try {
        const attachments = [
            {
                filename: 'shipping_label.pdf',
                path: `./order_label_pdf/${filename}`,
                content: "application/zip"
            }
        ];

        // Customer email content
        const customerContent = `<h1 style="margin-bottom: 2rem;">Thank you for you order!</h1>
        <p>Your order has been received and we have attached your shipping labels in a ZIP attachment to this email.</p>
        <p>For any questions or concerns, please contact our support team at <strong>${process.env.MAIL_USER}</strong> or <strong>6041231234</strong>.</p>`;
        const customerOrderConfirm = emailTemplate(email, 'KEMLabels - Your Bulk Shipping Label Order is Ready', customerContent, attachments);

        transporter.sendMail(customerOrderConfirm, (err, info) => {
            if (err) logger(`Error sending shipping label order confirmation to customer: ${err}`, "error");
            else logger(`Shipping label order confirmation email sent successfully to ${email}.`);
        });

        // KEMLabels email content
        const kemContent = `<h1 style="margin-bottom: 2rem;">New Bulk Shipping Label Order</h1>
        <p>A new shipping label order has been placed by ${email}. The shipping label has been attached to this email.</p>`;
        const kemlabelsOrderConfirm = emailTemplate(process.env.MAIL_USER, 'KEMLabels - New Shipping Label Order', kemContent, attachments);

        transporter.sendMail(kemlabelsOrderConfirm, (err, info) => {
            if (err) logger(`Error sending shipping label order confirmation to KEMLabels: ${err}`, "error");
            else logger(`Shipping label order confirmation email sent successfully to KEMLabels.`);
        });
    } catch (err) {
        logger(`Error sending email for updating email: ${err}`, "error");
    }
}

//CRON
// Schedule a task to run every 24 hours
cron.schedule('0 0 */1 * *', async () => {
    try {
        logger('CRON running');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        logger('Starting deletion of unverified accounts older than 24 hours...');

        // Delete unverified accounts created more than 24 hours ago
        const res = await User.deleteMany({ verified: false, createdAt: { $lt: twentyFourHoursAgo } });
        if (!res) logger(`Error deleting unverified accounts: ${err}`, "error");
        logger(`CRON job completed successfully. Deleted ${res.deletedCount} unverified accounts`);
    } catch (err) {
        if (err.name === 'MongoError' && err.code === 11000) {
            logger('MongoDB duplicate key error. Handle it appropriately.', "error");
        }
        logger('CRON job failed.', "error");
    }
});

// Schedule a task to run every Sunday midnight
cron.schedule('0 0 * * 0', () => {
    try {
        logger('CRON running');
        logger('Starting weekly deletion of shipping label order pdf files...');

        // Delete shipping label order pdf files
        const dir = './order_label_pdf';
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                fs.unlinkSync(`${dir}/${file}`, (err) => {
                    if (err) logger(`Error deleting shipping label order pdf: ${err}`, "error");
                });
            }
            logger(`Deleted ${files.length} shipping label order pdf files`);
        } else logger("Directory not found for shipping label order pdf files.");
    } catch (err) {
        if (err.name === 'MongoError' && err.code === 11000) {
            logger('MongoDB duplicate key error. Handle it appropriately.', "error");
        }
        logger('CRON job failed.', "error");
    }
});

//404 NOT FOUND
app.get('*', (req, res) => {
    res.status(404).json('PAGE NOT FOUND');
})

//Error handler function
async function handleErr(err, req, res, next) {
    logger(`Error Handler: ${err}`, "error")
    return res.json({ errMsg: err.message })
}

//Initiate Error handler
app.use(handleErr);

// Start server
if (fs.existsSync('logs.log')) fs.writeFileSync('logs.log', ''); // Clear logs file
logger(`Running environment: ${isDevelopmentEnv() ? 'DEVELOPMENT' : 'PRODUCTION'}`);
connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        logger(`Server is running on port ${process.env.PORT}`);
    });
})