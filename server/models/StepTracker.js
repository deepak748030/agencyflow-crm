const mongoose = require('mongoose');

const dailyStepLogSchema = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD
    steps: { type: Number, default: 0 },
    distance: { type: Number, default: 0 }, // in km
    calories: { type: Number, default: 0 }, // in kcal
    goal: { type: Number, default: 5000 },
}, { _id: false });

const stepTrackerSchema = new mongoose.Schema({
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
    totalSteps: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalDistance: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalCalories: {
        type: Number,
        default: 0,
        min: 0,
    },
    dailyGoal: {
        type: Number,
        default: 5000,
        min: 100,
    },
    dailyLogs: {
        type: [dailyStepLogSchema],
        default: [],
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

stepTrackerSchema.index({ totalSteps: -1 });
stepTrackerSchema.index({ isActive: 1, totalSteps: -1 });

module.exports = mongoose.model('StepTracker', stepTrackerSchema);
