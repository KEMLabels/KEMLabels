const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    credits: {
        type: Number,
        default: 0 
    },
    token: {
        type: String,
        required: true,
        default: ""
    },
    verified: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })

module.exports = mongoose.model('users', userSchema);