const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD
    count: { type: Number, default: 0 },
    malas: { type: Number, default: 0 },
}, { _id: false });

const naamJapUserSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    totalCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalMalas: {
        type: Number,
        default: 0,
        min: 0,
    },
    dailyLogs: {
        type: [dailyLogSchema],
        default: [],
    },
    pushToken: {
        type: String,
        default: null,
    },
    lastSyncAt: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for leaderboard queries
naamJapUserSchema.index({ totalMalas: -1 });
naamJapUserSchema.index({ isActive: 1, totalMalas: -1 });

module.exports = mongoose.model('NaamJapUser', naamJapUserSchema);
