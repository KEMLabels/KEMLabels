const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    token: { 
        type: String 
    },
    userid: { 
        type: String 
    },
    createdAt: { 
        type: Date, expires: '15m', default: Date.now 
    }
}, { timestamps: true })

module.exports = mongoose.model('tempTokens', tokenSchema);