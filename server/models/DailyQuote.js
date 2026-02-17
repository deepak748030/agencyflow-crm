const mongoose = require('mongoose');

const dailyQuoteSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        unique: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for fast date lookup
dailyQuoteSchema.index({ date: -1 });
dailyQuoteSchema.index({ isActive: 1, date: -1 });

module.exports = mongoose.model('DailyQuote', dailyQuoteSchema);
