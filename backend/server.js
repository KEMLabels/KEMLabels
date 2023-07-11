const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

app.use(express.json());
app.use('/', express.static(__dirname + '/public'));
app.use(cors());

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

app.post('/Signin', async (req, res) => {
    const{email,password} = req.body

    const data = {
        email:email,
        password:password
    }

    User.findOne({
        email: data.email.toLowerCase()
    }, function (err, user) {
        if (err) {
            console.log(err);
            res.json("redirect");
        }
        if (!user) {
            res.json("NoEmailExist");
        } else {
            return auth(req, res, user, data.password);
        }
    });
})

function auth(req, res, user, enteredPassword) {
    bcrypt.compare(enteredPassword, user.password, function (err, comp) {
        if (err) {
            console.log(err);
            res.json("redirect");
        } else if (comp === false) {
            res.json("wrongPassword");
        } else {
            req.session.user = user;
            req.session.isLoggedIn = true;
        }
    })
}

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.log(err);
    });
    res.json("redirect");
})

app.post("/Signup", async (req, res) => {
    const{userName, email,password} = req.body

    const data = {
        userName: userName,
        email:email,
        password:password
    }

    const userNameExists = await User.findOne({ userName: data.userName })
    if (userNameExists) res.json("userNameExists");
    const emailExists = await User.findOne({ email: data.email })
    if (emailExists) res.json("emailExists");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const new_user = new User({
        userName: data.userName,
        email: data.email,
        password: hashedPassword
    });
    new_user.save()

    // req.session.user = new_user;
    // req.session.isLoggedIn = true;
    res.json("redirect");
})


connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log("Server started on port " + process.env.PORT);
    })
})