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
var coinbase = require('coinbase-commerce-node');
var Client = coinbase.Client;
var resources = coinbase.resources;
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
        console.log(`Connected to DB`);
    } catch (error) {
        console.error("Couldn't connect to DB: ", error);
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
        console.log('PaymentIntent created successfully:', paymentIntent);
        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Error creating PaymentIntent:', err);
        res.status(500).send({ error: err.message });
    }
});

app.post('/webhook', express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    console.log('Received webhook payload:', req.body);

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Failed to verify webhook:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type !== "payment_intent.succeeded")  {
        console.log(`Webhook received unknown event type: ${event.type}`);
        return res.status(400).end();
    }

    try {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded! Payment Intent:', paymentIntent);
        const user = await User.findOne({ email: paymentIntent.metadata.email })
        if (!user) {
            console.error('User not found for email:', paymentIntent.metadata.email);
            throw new Error('User not found.');
        }

        // paymentIntent.amount is in cents so convert to dollars
        const userExistingCredits = user.credits;
        const newCredits = Number(userExistingCredits) + Number(paymentIntent.amount / 100);
        await User.updateOne({ "_id": user._id.toString() }, { "credits": newCredits });
        console.log(`User credits updated. New credits: ${newCredits}`);
    } catch (err) {
        console.error('Error updating user credits:', err);
        res.status(500).end();
    }
    res.status(200).end();
});

//COINBASE API
app.post("/payWithCrypto", async (req, res) => {
    try {
        const { amount, email } = req.body;
        console.log(`Initiating crypto payment for amount: ${amount} USD`);

        const charge = await resources.Charge.create({
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
        console.log(`Crypto payment initiated. Redirecting to hosted URL: ${charge.hosted_url}`);
        res.json({ redirect: charge.hosted_url });
    } catch (err) {
        console.error('Error during crypto payment:', err);
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

        if (event.type === "charge:confirmed") {
            console.log("Payment succeeded!");
            const user = await User.findOne({ email: event.metadata.email })
            if (!user) {
                console.error(`User not found for email: ${event.metadata.email}`);
                throw new Error('User not found.');
            }

            // paymentIntent.amount is in cents so convert to dollars
            const userExistingCredits = user.credits;
            const newCredits = Number(userExistingCredits) + Number(event.local.amount);
            await User.updateOne(
                { "_id": user._id.toString() },
                { "credits":  newCredits}
            );
            console.log(`User credits updated. New credits: ${newCredits}`);
        }
        res.status(200).end();
    } catch (err) {
        console.error("Failed to verify webook:", err);
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
            console.error(`Signin failed: User not found for email '${emailAddress}'.`);
            throw new Error('Incorrect email or password.');
        }

        const comparePass = await bcrypt.compare(password, user.password);
        if (!comparePass) {
            console.error(`Signin failed: Incorrect password for user '${emailAddress}'.`);
            throw new Error('Incorrect email or password.');
        }

        req.session.user = user;
        req.session.isLoggedIn = true;
        const userInfo = {
            credits: user.credits,
            userName: user.userName,
            joinedDate: user.createdAt,
        }
        console.log(`User '${emailAddress}' signed in successfully.`);
        res.status(200).json({ redirect: '/', userInfo });
    } catch (err) {
        console.error('Error signing in:', err);
        return res.status(400).json({ msg: err.message });
    }
})

//Logout
app.get('/logout', (req, res) => {
    try {
        req.session.destroy();
        console.log('User logged out successfully.');
        return res.json({ redirect: '/' })
    } catch (err) {
        console.error('Error during logout:', err);
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
            console.error(`Signup failed: Username '${userName}' is already associated with an account.`);
            throw new Error('This username is already associated with an account.');
        }

        const emailExists = await User.findOne({ email: data.email })
        if (emailExists) {
            console.error(`Signup failed: Email '${email}' is already associated with an account.`);
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
        console.log(`New user created: ID '${new_user._id}', Username '${new_user.userName}', Email '${new_user.email}'`);

        const token = crypto.randomBytes(32).toString("hex");
        const create_token = new tempTokens({
            token: token,
            userid: new_user._id
        })
        await create_token.save()
        console.log(`Verification token created and saved for user ID '${new_user._id}'`);

        const url = `${process.env.FRONTEND_SERVER}/users/${new_user._id}/verify/${token}`;
        console.log(`Verification URL generated: ${url}`);
        await sendSignUpConfirmationEmail(data.email, url);
        console.log(`Signup confirmation email sent successfully to ${data.email}.`);

        req.session.user = new_user;
        req.session.isLoggedIn = true;
        res.status(200).json({ redirect: '/verify-email' });
    } catch (err) {
        console.error('Error signing up:', err);
        return res.status(400).json({ msg: err.message });
    }
})

//Email verification
app.get("/generateToken", async (req, res) => {
    try {
        const findToken = await tempTokens.findOne({ userid: req.session.user._id.toString() });
        if (findToken) {
            await tempTokens.deleteOne({ _id: findToken._id.toString() });
            console.log('Token successfully deleted');
        }
        await generateTokenHelper(req.session.user._id, req.session.user.email);
        res.status(200).send("Token generated successfully");
    } catch (err) {
        console.error('Error generating token:', err);
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
        console.log(`URL for email verification: ${url}`)
        await sendSignUpConfirmationEmail(email, url);
    } catch (err) {
        console.error('Error generating token and sending confirmation email:', err);
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
            if (err) console.error('Error sending signup confirmation email:', err);
            else console.log(`Signup confirmation email sent successfully to ${emailAddress}.`);
        });
    } catch (err) {
        console.error('Error sending email for signup confirmation:', err);
    }
}

app.get('/users/:id/verify/:token', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (!user) {
            console.error('User not found for verification:', user);
            throw new Error('Link Invalid');
        }

        const token = await tempTokens.findOne({ token: req.params.token });
        if (!token) {
            const previoustoken = await tempTokens.findOne({ userid: req.params.id })
            if (previoustoken) {
                if (previoustoken.token !== req.params.token) {
                    console.error('Link Expired for user:', req.params.id);
                    throw new Error('Link Expired');
                }
            } else {
                console.error('Link Invalid for user:', req.params.id);
                throw new Error('Link Invalid');
            }
        }

        // Update user verification status
        await User.updateOne({ "_id": user._id.toString() }, { "verified": true });
        console.log('User has been verified:', user._id);

        // Delete the verification token
        await tempTokens.deleteOne({ token: req.params.token });
        console.log('Verification token successfully deleted:', req.params.token);

        return res.status(200).json({ redirect: '/' });
    } catch (err) {
        console.error('Error verifying user:', err);
        return res.status(400).json({ msg: err.message });
    }
})

app.get('/isUserVerified', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) {
            console.error('User not found for session user ID:', req.session.user._id);
            throw new Error('An error occurred.');
        }

        const verified = user.verified;
        if (!verified) {
            console.error('User is not verified:', user);
            throw new Error('Please check your inbox for a verification link to verify your account.');
        }

        console.log('User is verified:', user);
        res.status(200).json({ redirect: '/' });
    } catch (err) {
        console.error('Error checking user verification:', err);
        return res.status(400).json({ msg: err.message });
    }
})

app.get('/checkVerification', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) {
            console.error('User not found for session user ID:', req.session.user._id);
            throw new Error('An error occurred.');
        }

        const verified = user.verified;
        if (!verified) {
            console.error('User is not verified:', user);
            throw new Error('User is not verified');
        }
        
        console.log('User is verified:', user);
        res.status(200).json({ redirect: '/' });
    } catch (err) {
        console.error('Error checking user verification:', err);
        return res.status(400).json({ msg: err.message });
    }
})

//Forgot password
app.post("/emailExists", async (req, res) => {
    try {
        const data = { email: req.body.email.toLowerCase() }
        const user = await User.findOne({ email: data.email })
        if (!user) {
            console.log(`Email not found for: ${data.email}`);
            throw new Error('Hmm... this email is not associated with an account. Please try again.');
        }

        console.log(`Email found for: ${data.email}`);
        res.status(200).json({ user });
    } catch (err) {
        console.error('Error checking if email exists:', err);
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
        console.error('Error generating OTP for Forgot Password:', err);
        return res.status(400).json({ msg: err.message });
    }
})

app.post("/generateNewOTP", async (req, res) => {
    try {
        const { email, type } = req.body
        const existingOTP = await tempOTPS.findOneAndDelete({ email: email.toLowerCase() });

        if (existingOTP) console.log('Existing OTP record found and deleted:', existingOTP);
        else console.log('No existing OTP record found.');

        // Generate a new OTP and send the email
        generateOTPHelper(email, type);
        res.status(200).json({ msg: 'New OTP generated successfully.' });
    } catch (err) {
        console.error('Error generating new OTP:', err);
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
        console.error('Error generating OTP:', err);
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
            if (err) console.error(`Error sending OTP email for type ${type}:`, err);
            else console.log(`OTP email for type ${type} sent successfully to ${emailAddress}.`);
        });
    } else {
        console.error('Error in sendOTPEmail:', error);
    }
}

app.post("/checkOTP", async (req, res) => {
    try {
        const { enteredOTP, email } = req.body
        console.log(`OTP verification initiated for email: ${email}`);
        console.log(`Entered OTP: ${enteredOTP}`);

        const tempCode = await tempOTPS.findOneAndDelete({ email: email.toLowerCase() });

        if (!tempCode) {
            console.error('OTP verification failed: Invalid code or expired session.');
            throw new Error("Invalid Code");
        }
        console.log(`Correct OTP retrieved from the database: ${tempCode.passcode}`);

        if (Number(enteredOTP) !== Number(tempCode.passcode)) {
            console.error('OTP verification failed: Incorrect code entered.');
            throw new Error('Hmm... your code was incorrect. Please try again.');
        }
        console.log(`OTP verification successful. Deleted record for code: ${enteredOTP}`);

        res.status(200).json("success");
    } catch (err) {
        console.error('Error during OTP verification:', err);
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
            console.error('User not found during password update.');
            throw new Error("An unexpected error occurred. Please try again later.");
        }

        await User.updateOne(
            { "_id": userData._id.toString() },
            { "password": hashedPassword }
        );
        console.log("Password updated successfully.");

        sendPasswordChangeEmail(email);
        console.log("Password change notification email sent successfully.");

        res.json({ redirect: '/signin' });
    } catch (err) {
        console.error('Error updating user password:', err);
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
            if (err) console.error('Error sending password change email:', err);
            else console.log(`Password change email sent successfully to ${emailAddress}.`);
        });
    } catch (err) {
        console.error('Error sending email for updating password:', err);
    }
}

//Credit history
app.get('/getCreditHistory', async (req, res) => {
    try {
        const email = req.session.user.email;
        console.log(`Received request to fetch credit history for user: ${email}`);

        const paymentIntent = await stripe.paymentIntents.search({
            query: `status:\'succeeded\' AND metadata[\'email\']:\'${email}\'`,
            limit: 100,
        });
        console.log(`Fetched ${paymentIntent.data.length} payment intents for user: ${email}`);

        const charge = await resources.Charge.all({}, function (error, list) {
            console.log(error);
            console.log(list);
          });

        console.log("charge: " + charge);

        const formattedPaymentIntents = [];

        for (const intent of paymentIntent.data) {
            const createdTimestamp = intent.created;

            const createdDate = format(new Date(createdTimestamp * 1000), 'MMMM dd, yyyy');
            const createdTime = format(new Date(createdTimestamp * 1000), 'hh:mm a');

            const statusMapping = {
                succeeded: 'Success',
                processing: 'Processing',
            };

            formattedPaymentIntents.push({
                refId: intent.id,
                paymentDate: createdDate,
                paymentTime: createdTime,
                amount: intent.amount / 100, // convert to dollars
                type: 'Stripe',
                status: statusMapping[intent.status] || 'Failed',
            });
        }

        console.log('Formatted payment intents:', formattedPaymentIntents);
        res.send(formattedPaymentIntents);
    } catch (err) {
        console.error('Error fetching credit history:', err);
        res.status(400).send('An error occurred while fetching credit history.');
    }
})

//Username Change
app.post("/UpdateUsername", async (req, res) => {
    try {
        const { userName } = req.body;
        const userNameData = userName.toLowerCase();
        console.log(`Received request to update username to ${userNameData}.`);

        // Retrieve the user from the session
        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) {
            console.error('User not found during username update.');
            throw new Error("An unexpected error occurred. Please try again later.");
        }

        const currentDate = new Date();
        if (user.userNameLastChanged) {
            // Calculate the time difference in hours and minutes
            const timeDiff = Math.abs(currentDate - user.userNameLastChanged);
            const hoursPassed = Math.floor(timeDiff / 3600000);
            const minutesPassed = Math.floor((timeDiff % 3600000) / 60000);

            const remainingHours = 24 - hoursPassed;
            let remainingMinutes = 60 - minutesPassed;

            if (remainingHours > 0 || (remainingHours === 0 && remainingMinutes > 0)) {
                console.error(`Username change request failed: User must wait ${remainingHours} hours and ${remainingMinutes} minutes to change their username.`);
                if (remainingHours === 24) throw new Error(`You must wait ${remainingHours} hours before you can change your username again.`);
                else throw new Error(`You must wait ${remainingHours} hours and ${remainingMinutes} minutes before you can change your username again.`);
            }
        }

        if (userNameData === user.userName) {
            console.error('Username change request failed: New username is the same as the current username.');
            throw new Error("You cannot change your username to the same one you currently have.");
        }

        // Check if the new username is already used by another user
        const userNameAlreadyUsed = await User.findOne({ userName: userNameData });
        if (userNameAlreadyUsed) {
            console.error('Username change request failed: New username is already associated with another account.');
            throw new Error("This username is already associated with an account.");
        }

        // Update the username and userNameLastChanged
        await User.updateOne(
            { "_id": user._id.toString() },
            { "userName": userNameData, "userNameLastChanged": currentDate }
        );
        console.log(`Username updated successfully to ${userNameData}.`);

        sendUserNameChangeEmail(user.email);
        console.log(`Username change email sent successfully to ${user.email}.`);

        return res.status(200).json({ msg: 'Username updated successfully.' });
    } catch (err) {
        console.error('Error updating username:', err);
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
            if (err) console.error('Error sending username change email:', err);
            else console.log(`Username change email sent successfully to ${emailAddress}.`);
        });
    } catch (err) {
        console.error('Error sending email for updating username:', err);
    }
}

//Email Change
app.post("/sendEmailChangeConfirmation", async (req, res) => {
    try {
        const { newEmail } = req.body
        const currentEmail = req.session.user.email;
        console.log(`Received request to change email from ${currentEmail} to ${newEmail.toLowerCase()}.`);

        if (newEmail.toLowerCase() === currentEmail) {
            console.error('Email change request failed: New email is the same as the current email.');
            throw new Error("You cannot change your email to the one you currently have.");
        }

        // Check if the new email is already used by another user
        const emailAlreadyUsed = await User.findOne({ email: newEmail.toLowerCase() });
        if (emailAlreadyUsed) {
            console.error('Email change request failed: New email is already associated with another account.');
            throw new Error("This email is already associated with an account.");
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        const create_OTP = new tempOTPS({ passcode: otp, email: newEmail })
        await create_OTP.save()
        console.log(`Generated OTP ${otp} for email change confirmation.`);

        sendEmailChangeRequestEmail(currentEmail, newEmail.toLowerCase(), otp)
        console.log(`Email change confirmation sent successfully to ${newEmail.toLowerCase()}.`);
        return res.status(200).json({ msg: `A confirmation email with instructions has been sent to ${newEmail.toLowerCase()}.` });
    } catch (err) {
        console.error('Error processing email change confirmation:', err);
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
            if (err) console.error('Error sending security alert email for updating email:', err);
            else console.log(`Security alert email sent successfully to ${currentEmail}.`);
        });
        sendOTPEmail(OTPPasscode, newEmail, "changeEmail");
        console.log(`OTP email sent successfully to ${newEmail}.`);
    } catch (err) {
        console.error('Error sending email for updating email:', err);
    }
}

app.post("/updateEmailAddress", async (req, res) => {
    try {
        const { newEmail } = req.body;
        console.log(`Received request to update email address to ${newEmail}.`);

        const user = await User.findOne({ _id: req.session.user._id });
        if (!user) {
            console.error('User not found during /updateEmailAddress.');
            throw new Error("An unexpected error occurred. Please try again later.");
        }

        await User.updateOne(
            { "_id": user._id.toString() },
            { "email": newEmail.toLowerCase(), "verified": false }
        );
        console.log(`Updated email to ${newEmail} and set user as unverified.`);

        sendEmailChangeEmail(newEmail.toLowerCase());
        console.log(`Email change notification sent to ${newEmail}.`);

        return res.status(200).json({ msg: 'Email address updated successfully.' });
    } catch (err) {
        console.error('Error updating email address:', err);
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
            if (err) console.error('Error sending email:', err);
            else console.log(`Email sent successfully to ${emailAddress}.`);
        });
    } catch (err) {
        console.error('Error sending email for updating email:', err);
    }
}

//Password Change
app.post("/sendPasswordChangeConfirmation", async (req, res) => {
    try {
        const { enteredPassword, newPassword } = req.body;
        const currentPassword = req.session.user.password;

        console.log('Received request for password change confirmation.');

        const comparePassword = await bcrypt.compare(enteredPassword, currentPassword);
        if (!comparePassword) {
            console.error('Entered password does not match the current password.');
            throw new Error("Hmm... your current password is incorrect. Please try again.");
        }

        const comparePassWithNewPass = await bcrypt.compare(newPassword, currentPassword);
        if (comparePassWithNewPass) {
            console.error('Entered password is the same as the current password.');
            throw new Error("Looks like you have entered the same password that you are using now. Please enter a differernt password.");
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        const userEmail = req.session.user.email;

        console.log(`Generated OTP ${otp} for user ${userEmail}.`);

        const create_OTP = new tempOTPS({ passcode: otp, email: userEmail })
        await create_OTP.save();
        sendOTPEmail(otp, userEmail, "changePassword");
        return res.status(200).json({ msg: `A confirmation email with instructions has been sent to ${userEmail}.` });
    } catch (err) {
        console.error('Error processing password change confirmation:', err);
        return res.status(400).json({ msg: err.message });
    }
})

// Order Label
// TODO: @Kian do the POST request here for DB update
// 1) use the form values to send to our API
// 2) update user's credits in DB by subtracting totalAmount from their total credits
// 3) also save each order in a schema so we can keep track of all orders coming in. 
// 4) Send email to both USER using email and OUR email so 2 emails to send
// 5) also save senderInfo in formValues to DB so we can preload it to the frontend when they want to create more orders in the future
app.post("/orderLabel", (req, res) => {
    try {
        console.log("Received orderLabel request.");
        const { email, formValues, totalAmount } = req.body;
        console.log(`Email: ${email}, Total Amount: ${totalAmount}, Form Values: ${JSON.stringify(formValues)}`);
        console.log("OrderLabel request processed successfully.");
        return res.status(200).json({ msg: "OrderLabel request processed successfully." });
    } catch (err) {
        console.error("Error processing orderLabel request:", err);
        return res.status(400).json({ msg: err.message });
    }
})

//CRON
// Schedule a task to run every 24 hours
cron.schedule('0 0 */1 * *', async () => {
    try {
        console.log('CRON running');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        console.log('Starting deletion of unverified accounts older than 24 hours...');

        // Delete unverified accounts created more than 24 hours ago
        const res = await User.deleteMany({ verified: false, createdAt: { $lt: twentyFourHoursAgo } });
        console.log(`CRON job completed successfully. Deleted ${res.deletedCount} unverified accounts`);
    } catch (err) {
        console.error('Error deleting unverified accounts:', err);
        if (err.name === 'MongoError' && err.code === 11000) {
            console.error('MongoDB duplicate key error. Handle it appropriately.');
        }
        console.error('CRON job failed.');
    }
});

//404 NOT FOUND
app.get('*', (req, res) => {
    res.status(404).json('PAGE NOT FOUND');
})

//Error handler function
async function handleErr(err, req, res, next) {
    console.log("Error Handler:", err.message)
    return res.json({ errMsg: err.message })
}

//Initiate Error handler
app.use(handleErr);

// Start server
console.log(`Running environment: ${isDevelopmentEnv() ? 'DEVELOPMENT' : 'PRODUCTION'}`);
connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log("Server is running on port " + process.env.PORT);
    });
})
