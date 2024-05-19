const mongoose = require('mongoose')

const OTPSchema = new mongoose.Schema({
    passcode: { 
        type: Number 
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: { 
        type: Date, expires: '5m', default: Date.now 
    }
}, { timestamps: true })

module.exports = mongoose.model('tempOTPs', OTPSchema);