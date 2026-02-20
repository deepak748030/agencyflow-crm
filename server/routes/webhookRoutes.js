const express = require('express');
const { razorpayWebhook } = require('../controllers/webhookController');
const router = express.Router();

// Razorpay webhook - no auth needed, verified by signature
router.post('/razorpay', razorpayWebhook);

module.exports = router;
