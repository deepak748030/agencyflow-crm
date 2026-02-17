const express = require('express');
const router = express.Router();
const StepTracker = require('../models/StepTracker');

// Sync step data
router.post('/sync', async (req, res) => {
    try {
        const { deviceId, mobile, todaySteps, todayDistance, todayCalories, dailyGoal } = req.body;

        if (!deviceId || !mobile) {
            return res.status(400).json({ success: false, message: 'deviceId and mobile are required' });
        }

        const today = new Date().toISOString().split('T')[0];

        let user = await StepTracker.findOne({ deviceId });

        if (!user) {
            user = new StepTracker({
                deviceId,
                mobile,
                totalSteps: todaySteps || 0,
                totalDistance: todayDistance || 0,
                totalCalories: todayCalories || 0,
                dailyGoal: dailyGoal || 5000,
                dailyLogs: [{
                    date: today,
                    steps: todaySteps || 0,
                    distance: todayDistance || 0,
                    calories: todayCalories || 0,
                    goal: dailyGoal || 5000,
                }],
            });
        } else {
            const existingLogIndex = user.dailyLogs.findIndex(l => l.date === today);
            const oldTodaySteps = existingLogIndex >= 0 ? user.dailyLogs[existingLogIndex].steps : 0;
            const oldTodayDist = existingLogIndex >= 0 ? user.dailyLogs[existingLogIndex].distance : 0;
            const oldTodayCal = existingLogIndex >= 0 ? user.dailyLogs[existingLogIndex].calories : 0;

            if (existingLogIndex >= 0) {
                user.dailyLogs[existingLogIndex].steps = todaySteps || 0;
                user.dailyLogs[existingLogIndex].distance = todayDistance || 0;
                user.dailyLogs[existingLogIndex].calories = todayCalories || 0;
                user.dailyLogs[existingLogIndex].goal = dailyGoal || 5000;
            } else {
                user.dailyLogs.push({
                    date: today,
                    steps: todaySteps || 0,
                    distance: todayDistance || 0,
                    calories: todayCalories || 0,
                    goal: dailyGoal || 5000,
                });
            }

            // Keep only last 90 days
            if (user.dailyLogs.length > 90) {
                user.dailyLogs = user.dailyLogs.slice(-90);
            }

            user.totalSteps = user.totalSteps - oldTodaySteps + (todaySteps || 0);
            user.totalDistance = user.totalDistance - oldTodayDist + (todayDistance || 0);
            user.totalCalories = user.totalCalories - oldTodayCal + (todayCalories || 0);
            if (dailyGoal) user.dailyGoal = dailyGoal;
            user.mobile = mobile;
        }

        user.lastSyncAt = new Date();
        await user.save();

        res.json({ success: true, response: user });
    } catch (error) {
        console.error('Step sync error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user step data
router.get('/user/:deviceId', async (req, res) => {
    try {
        const user = await StepTracker.findOne({ deviceId: req.params.deviceId });
        if (!user) {
            return res.json({ success: true, response: null });
        }
        res.json({ success: true, response: user });
    } catch (error) {
        console.error('Step fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
