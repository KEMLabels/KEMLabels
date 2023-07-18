const express = require("express");
const app = express();
const cors = require('cors');
const bcrypt = require("bcrypt")
const axios = require('axios')
const session = require('express-session');
const dotenv = require("dotenv")
const cookieParser = require('cookie-parser');
dotenv.config();
require('express-async-errors');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
app.enable('trust proxy');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_STRING, { useNewUrlParser: true });
        console.log(`Connected to DB`);
    } catch (error) {
        console.log("Couldn't connect to DB: ", error);
        process.exit(1);
    }
}

const User = require('./model/users.js');

const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.DB_STRING,
    collection: 'sessions',
});

app.use('/', express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000/");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const whitelist = ['http://localhost:8081', 'http://localhost:3000']
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


async function handleErr(err, req, res, next) {
    console.log(err.message)
    return res.json({ errMsg: err.message })
}

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

app.get('/getSessionInfo', (req, res) => {
    res.json({
        isLoggedIn: req.session.isLoggedIn
    })
})

app.get('/getUserData', (req, res) => {
    if (!req.session.user) {
        return null;
    }
    res.json({
        userData: req.session.user
    })
})

app.get('/logout', (req, res) => {
    req.session.destroy();
    return res.json({ redirect: '/' })
})

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
        password: hashedPassword
    });
    new_user.save()

    req.session.user = new_user;
    req.session.isLoggedIn = true;
    res.json({ redirect: '/' });
})

app.use(handleErr);

connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log("Server started on port " + process.env.PORT);
    })
})