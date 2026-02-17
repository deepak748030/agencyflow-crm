const express = require('express');
const jwt = require('jsonwebtoken');
const { Expo } = require('expo-server-sdk');
const Admin = require('../models/Admin');
const NaamJapUser = require('../models/NaamJapUser');
const router = express.Router();

const expo = new Expo();

// Admin auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!admin) return res.status(401).json({ success: false, message: 'Admin not found' });
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// POST /api/notifications/send - Send push notification to all users
router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { title, body } = req.body;
        console.log('=== PUSH NOTIFICATION SEND START ===');
        console.log('Title:', title);
        console.log('Body:', body);

        if (!title || !body) {
            console.log('ERROR: title or body missing');
            return res.status(400).json({
                success: false,
                message: 'title and body are required',
            });
        }

        // Get all users with push tokens
        const users = await NaamJapUser.find({
            isActive: true,
            pushToken: { $exists: true, $nin: [null, ''] },
        }).select('pushToken name');

        console.log('Total users with push tokens:', users.length);

        if (users.length === 0) {
            console.log('No users with push tokens found');
            return res.json({
                success: true,
                response: {
                    sent: 0,
                    failed: 0,
                    total: 0,
                    message: 'No users with push tokens found',
                },
            });
        }

        // Log all tokens for debugging
        users.forEach((user, i) => {
            console.log(`User ${i + 1}: ${user.name} -> token: ${user.pushToken}`);
        });

        // Build messages
        const messages = [];
        const skippedTokens = [];
        for (const user of users) {
            if (!Expo.isExpoPushToken(user.pushToken)) {
                console.log(`SKIP invalid token for ${user.name}: ${user.pushToken}`);
                skippedTokens.push({ name: user.name, token: user.pushToken });
                continue;
            }
            messages.push({
                to: user.pushToken,
                sound: 'default',
                title: title,
                body: body,
                data: { screen: 'naam-jap-counter' },
            });
        }

        console.log('Valid messages to send:', messages.length);
        console.log('Skipped invalid tokens:', skippedTokens.length);

        if (messages.length === 0) {
            console.log('No valid push tokens to send to');
            return res.json({
                success: true,
                response: {
                    sent: 0,
                    failed: 0,
                    total: 0,
                    skipped: skippedTokens.length,
                    message: 'No valid push tokens found',
                },
            });
        }

        // Send in chunks
        const chunks = expo.chunkPushNotifications(messages);
        console.log('Sending in', chunks.length, 'chunk(s)');
        let sent = 0;
        let failed = 0;
        const errors = [];

        for (const chunk of chunks) {
            try {
                console.log('Sending chunk of', chunk.length, 'messages...');
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('Chunk response:', JSON.stringify(ticketChunk));

                for (let i = 0; i < ticketChunk.length; i++) {
                    const ticket = ticketChunk[i];
                    if (ticket.status === 'ok') {
                        sent++;
                        console.log(`Ticket ${i}: OK (id: ${ticket.id})`);
                    } else {
                        failed++;
                        console.log(`Ticket ${i}: FAILED - ${ticket.message} (details: ${JSON.stringify(ticket.details)})`);
                        errors.push({ token: chunk[i].to, error: ticket.message });
                    }
                }
            } catch (error) {
                console.error('Error sending chunk:', error.message);
                failed += chunk.length;
                errors.push({ error: error.message });
            }
        }

        console.log('=== PUSH NOTIFICATION SEND COMPLETE ===');
        console.log('Sent:', sent, '| Failed:', failed, '| Total:', messages.length);

        res.json({
            success: true,
            response: {
                sent,
                failed,
                total: messages.length,
                skipped: skippedTokens.length,
                errors: errors.length > 0 ? errors : undefined,
            },
        });
    } catch (error) {
        console.error('=== PUSH NOTIFICATION ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, message: 'Failed to send notifications' });
    }
});

module.exports = router;
