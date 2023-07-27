const express = require("express");
const app = express();
const cors = require('cors');
const bcrypt = require("bcrypt")
const axios = require('axios')
const session = require('express-session');
const dotenv = require("dotenv")
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');
dotenv.config();
require('express-async-errors');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
app.enable('trust proxy');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripe = require("stripe")(stripeSecretKey);

//Connect to Mongo
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_STRING, { useNewUrlParser: true });
        console.log(`Connected to DB`);
    } catch (error) {
        console.log("Couldn't connect to DB: ", error);
        process.exit(1);
    }
}

//Import schema modules
const User = require('./model/users.js');
const tempTokens = require('./model/tempToken.js');
const tempOTPS = require('./model/tempOTPs.js');

const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.DB_STRING,
    collection: 'sessions',
});

//Start app
app.use('/', express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000/");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
const whitelist = 'http://localhost:3000'
app.use(cors({
    origin: whitelist,
    methods: ['POST', 'GET', 'PATCH', 'OPTIONS'],
    credentials: true
}));
app.use(session({
    name: 'sessionID',
    secret: 'strongass',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 600000,
        httpOnly: true,
        // secure: true,
        // sameSite: 'none',
    },
    store: store,
}));

//Set up transporter for nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

//STRIPE API

app.get("/getStripePublicKey", (req, res) => {
    const key = stripePublicKey;
    res.json(key);
})

const calculateOrderAmount = (amount) => {
    const totalVal = amount * 100;
    return Number(totalVal);
};

app.post("/create-payment-intent", async (req, res) => {
    const { amount } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: calculateOrderAmount(amount),
        currency: "usd",
        automatic_payment_methods: {
            enabled: true,
        },
    });

    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

// app.post("/webhook", (req, res) => {
//     const event = req.body;

//     // Verify the event came from Stripe (optional but recommended)
//     const signature = req.headers["stripe-signature"];
//     try {
//         // Replace YOUR_STRIPE_WEBHOOK_SECRET with your actual webhook secret key
//         const verifiedEvent = stripe.webhooks.constructEvent(
//             req.rawBody,
//             signature,
//             "YOUR_STRIPE_WEBHOOK_SECRET"
//         );
//         handleWebhookEvent(verifiedEvent);
//         res.sendStatus(200);
//     } catch (error) {
//         console.error("Webhook signature verification failed.", error);
//         res.sendStatus(400);
//     }
// });

// const handleWebhookEvent = (event) => {
//     // Check if the event is a successful payment event
//     if (event.type === "payment_intent.succeeded") {
//       const paymentIntent = event.data.object;
//       console.log("Payment succeeded!", paymentIntent);
//     }
//   };

//Error handler function
async function handleErr(err, req, res, next) {
    console.log(err.message)
    return res.json({ errMsg: err.message })
}

//Signing in
app.post('/signin', async (req, res) => {
    const { email, password } = req.body

    const data = {
        email: email,
        password: password
    }

    var emailAddress = data.email.toLowerCase();

    let user = await User.findOne({ email: emailAddress })
    if (!user)
        throw new Error('Incorrect email or password.');
    else
        return auth(req, res, user, data.password);
})

async function auth(req, res, user, enteredPassword) {
    const comparePass = await bcrypt.compare(enteredPassword, user.password);
    if (!comparePass) {
        throw new Error('Incorrect email or password.');
    } else {
        req.session.user = user;
        req.session.isLoggedIn = true;
        res.json({ redirect: '/' });
    }
}

//Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    return res.json({ redirect: '/' })
})

//Signing up
app.post("/signup", async (req, res) => {
    const { userName, email, password } = req.body

    const data = {
        userName: userName,
        email: email,
        password: password
    }

    const userNameExists = await User.findOne({ userName: data.userName })
    if (userNameExists) throw new Error('This username is already associated with an account.');
    const emailExists = await User.findOne({ email: data.email })
    if (emailExists) throw new Error('This email is already associated with an account.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const new_user = new User({
        userName: data.userName,
        email: data.email,
        password: hashedPassword,
    });
    new_user.save()

    const token = crypto.randomBytes(32).toString("hex");
    const create_token = new tempTokens({
        token: token,
        userid: new_user._id
    })
    create_token.save()
    const url = `http://localhost:3000/users/${new_user._id}/verify/${token}`;
    await sendSignUpConfirmationEmail(data.email, url);

    req.session.user = new_user;
    req.session.isLoggedIn = true;
    res.json({ redirect: '/verifyemail' });
})

//Email verification
app.get("/generateToken", async (req, res) => {
    const findToken = await tempTokens.findOne({ userid: req.session.user._id.toString() });
    if (findToken) {
        tempTokens.deleteOne({
            _id: findToken._id.toString()
        })
            .then(function () {
                console.log('successfuly deleted');
            }).catch(function (error) {
                console.log(error); // Failure
            });
    }
    generateTokenHelper(req.session.user._id, req.session.user.email);
})

async function generateTokenHelper(userID, email) {
    const token = crypto.randomBytes(32).toString("hex");
    const create_token = new tempTokens({
        token: token,
        userid: userID
    })
    create_token.save()
    const url = `http://localhost:3000/users/${userID}/verify/${token}`;
    console.log(url);
    sendSignUpConfirmationEmail(email, url);
}

async function sendSignUpConfirmationEmail(emailAddress, url) {
    const signUpConfirmationEmail = {
        from: process.env.MAIL_USER,
        to: emailAddress,
        subject: 'Sign up confirmation',
        html: `<div style="display:flex;width:100%;background:#09C5A3;"><img src="cid:logo" style="width:15%;margin:auto;padding:1.5rem 1rem 1rem;object-fit:contain;object-position:center center;"></div>
        <div style="display:flex;width:100%;background:#09C5A3;margin-bottom:2rem;"><h1 style="text-align:center;color:#FFF;text-transform:capitalize;font-size:2rem;font-weight:700;padding-top:1rem;padding-bottom:1rem;width: 100%;">You have a new patient waiting for you!</h1></div>
        <p style="font-size:14px;color:#000;">Thank you for signing up with us! Verify your acount here: ${url}</p><p style="font-size:14px;color:#000;">Cheers</p>`,
    }
    transporter.sendMail(signUpConfirmationEmail, function (err, info) {
        if (err) console.log(err)
    });
}

app.get('/users/:id/verify/:token', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (!user) throw new Error('Invalid Link');
        const token = await tempTokens.findOne({ token: req.params.token });
        if (!token) throw new Error('Invalid Link');

        User.updateOne({
            "_id": user._id.toString()
        }, {
            "verified": true
        })
            .then((obj) => {
                console.log("User has been verified");
            })
            .catch((err) => {
                console.log(err);
            })

        tempTokens.deleteOne({
            token: req.params.token
        })
            .then(function () {
                console.log('successfuly deleted');
            }).catch(function (error) {
                console.log(error); // Failure
            });

        return res.json({ redirect: '/' });
    } catch (err) {
        console.log(err);
    }
})

app.get('/isUserVerified', async (req, res) => {
    const user = await User.findOne({ _id: req.session.user._id });
    if (!user) throw new Error('An error occured.');
    const verified = user.verified;

    if (!verified) throw new Error('Please check your inbox for a verification link to verify your account.');
    else res.json({ redirect: '/' });
})

app.get('/checkVerification', async (req, res) => {
    const user = await User.findOne({ _id: req.session.user._id });
    if (!user) throw new Error('An error occured.');
    const verified = user.verified;
    if (!verified) throw new Error('User is not verified');
    res.json({ redirect: '/' });
})

//Forgot password
app.post("/emailExists", async (req, res) => {
    const { email } = req.body

    const data = {
        email: email
    }

    const emailExists = await User.findOne({ email: data.email })
    if (!emailExists) throw new Error('This email is not associated with an account.');
    else res.json({ emailExists });
})

app.post("/forgotpassword", async (req, res) => {
    const { email } = req.body
    const otp = Math.floor(1000 + Math.random() * 9000);

    const create_OTP = new tempOTPS({
        passcode: otp,
        email: email
    })
    create_OTP.save()
    sendOTPEmail(otp, email);
})

app.post("/generateNewOTP", async (req, res) => {
    const { email } = req.body
    const findOTP = await tempOTPS.findOne({ email: email });
    if (findOTP) {
        console.log(findOTP)
        tempOTPS.deleteOne({
            _id: findOTP._id.toString()
        })
            .then(function () {
                generateOTPHelper(email);
                console.log('successfuly deleted');
            }).catch(function (error) {
                console.log(error); // Failure
            });
    } else {
        generateOTPHelper(email);
    }
})

async function generateOTPHelper(email) {
    const otp = Math.floor(1000 + Math.random() * 9000);
    const create_OTP = new tempOTPS({
        passcode: otp,
        email: email
    })
    create_OTP.save()
    sendOTPEmail(otp, email);
}

function sendOTPEmail(OTPPasscode, emailAddress) {
    const sendOneTimePasscodeEmail = {
        from: process.env.MAIL_USER,
        to: emailAddress,
        subject: 'Your One Time Passcode',
        html: `<div style="display:flex;width:100%;background:#09C5A3;"><img src="cid:logo" style="width:15%;margin:auto;padding:1.5rem 1rem 1rem;object-fit:contain;object-position:center center;"></div>
        <div style="display:flex;width:100%;background:#09C5A3;margin-bottom:2rem;"><h1 style="text-align:center;color:#FFF;text-transform:capitalize;font-size:2rem;font-weight:700;padding-top:1rem;padding-bottom:1rem;width: 100%;">You have a new patient waiting for you!</h1></div>
        <p style="font-size:14px;color:#000;">Your OTP is: ${OTPPasscode} </p><p style="font-size:14px;color:#000;">Cheers</p>`,
    }
    transporter.sendMail(sendOneTimePasscodeEmail, function (err, info) {
        if (err) console.log(err)
    });
}

app.post("/checkOTP", async (req, res) => {
    const { enteredOTP } = req.body
    const { email } = req.body
    console.log('entered code: ' + enteredOTP);
    const tempCode = await tempOTPS.findOne({ email: email });
    if (!tempCode) throw new Error("Invalid Code");
    console.log('correct code: ' + tempCode.passcode);
    if (Number(enteredOTP) !== Number(tempCode.passcode)) {
        throw new Error('Incorrect code. Please try again.');
    } else {
        tempOTPS.deleteOne({
            passcode: enteredOTP
        })
            .then(function () {
                console.log('successfuly deleted');
            }).catch(function (error) {
                console.log(error); // Failure
            });
    }
    res.status(200).json("success");
})

//Reset password
app.post("/updateUserPass", async (req, res) => {
    const { email, password } = req.body

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = await User.findOne({ email: email })

    User.updateOne({
        "_id": userData._id.toString()
    }, {
        "password": hashedPassword
    })
        .then((obj) => {
            console.log("Updated Password");
        })
        .catch((err) => {
            console.log(err);
        })

    sendChangePasswordConfirmation(email);

    res.json({ redirect: '/signin' });

})

function sendChangePasswordConfirmation(emailAddress) {
    const changePassConfirmation = {
        from: process.env.MAIL_USER,
        to: emailAddress,
        subject: 'Your One Time Passcode',
        html: `<div style="display:flex;width:100%;background:#09C5A3;"><img src="cid:logo" style="width:15%;margin:auto;padding:1.5rem 1rem 1rem;object-fit:contain;object-position:center center;"></div>
        <div style="display:flex;width:100%;background:#09C5A3;margin-bottom:2rem;"><h1 style="text-align:center;color:#FFF;text-transform:capitalize;font-size:2rem;font-weight:700;padding-top:1rem;padding-bottom:1rem;width: 100%;">You have a new patient waiting for you!</h1></div>
        <p style="font-size:14px;color:#000;">Your password has been changed. </p><p style="font-size:14px;color:#000;">Cheers</p>`,
    }
    transporter.sendMail(changePassConfirmation, function (err, info) {
        if (err) console.log(err)
    });
}

//404 NOT FOUND
app.get('*', (req, res) => {
    throw new Error('PAGE NOT FOUND');
})

app.use(handleErr);

connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log("Server started on port " + process.env.PORT);
    })
})