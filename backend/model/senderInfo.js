const mongoose = require('mongoose')

const senderInfo = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        default: ""
    },
    address1: {
        type: String,
        required: true,
        default: ""
    },
    address2: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        required: true,
        default: ""
    },
    state: {
        type: String,
        required: true,
        default: ""
    },
    postal_code: {
        type: String,
        required: true,
        default: ""
    },
    phone: {
        type: String,
        required: true,
        default: ""
    },
    country: {
        type: String,
        required: true,
        default: ""
    },
}, { timestamps: true })

module.exports = mongoose.model('senderInfo', senderInfo);