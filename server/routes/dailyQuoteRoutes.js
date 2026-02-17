const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Admin = require('../models/Admin');
const DailyQuote = require('../models/DailyQuote');
const router = express.Router();

// Multer config - store in memory for Cloudinary upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

// Auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = 'daily-quotes') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                quality: 'auto',
                fetch_format: 'auto',
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// Helper: delete from Cloudinary by URL
const deleteFromCloudinary = async (imageUrl) => {
    try {
        // Extract public_id from URL
        const parts = imageUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return;
        // Skip version (v1234567890) and get the rest without extension
        const pathParts = parts.slice(uploadIndex + 2);
        const publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error.message);
    }
};

// ============ PUBLIC ROUTES (for mobile app - no auth needed) ============

// GET /api/daily-quotes/today - Get today's image (public)
router.get('/today', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let quote = await DailyQuote.findOne({
            date: { $gte: today, $lt: tomorrow },
            isActive: true,
        });

        if (!quote) {
            quote = await DailyQuote.findOne({ isActive: true }).sort({ date: -1 });
        }

        if (!quote) {
            return res.json({
                success: true,
                response: null,
                message: 'No daily image available',
            });
        }

        res.json({ success: true, response: quote });
    } catch (error) {
        console.error('Get today image error:', error);
        res.status(500).json({ success: false, message: 'Failed to get daily image' });
    }
});

// GET /api/daily-quotes/recent - Get recent images (public)
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 7;
        const quotes = await DailyQuote.find({ isActive: true })
            .sort({ date: -1 })
            .limit(limit);

        res.json({ success: true, response: quotes });
    } catch (error) {
        console.error('Get recent images error:', error);
        res.status(500).json({ success: false, message: 'Failed to get recent images' });
    }
});

// ============ ADMIN ROUTES (require auth) ============

// POST /api/daily-quotes/upload - Upload image to Cloudinary (admin)
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const result = await uploadToCloudinary(req.file.buffer);

        res.json({
            success: true,
            response: {
                imageUrl: result.secure_url,
                publicId: result.public_id,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
});

// GET /api/daily-quotes - List all (admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [quotes, total] = await Promise.all([
            DailyQuote.find().sort({ date: -1 }).skip(skip).limit(limit),
            DailyQuote.countDocuments(),
        ]);

        res.json({
            success: true,
            response: {
                quotes,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        console.error('List images error:', error);
        res.status(500).json({ success: false, message: 'Failed to list images' });
    }
});

// POST /api/daily-quotes - Create new (admin)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { imageUrl, date } = req.body;

        if (!imageUrl || !date) {
            return res.status(400).json({
                success: false,
                message: 'imageUrl and date are required',
            });
        }

        const quoteDate = new Date(date);
        quoteDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(quoteDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const existing = await DailyQuote.findOne({
            date: { $gte: quoteDate, $lt: nextDay },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'An image already exists for this date. Please edit or delete it first.',
            });
        }

        const quote = new DailyQuote({
            imageUrl,
            date: quoteDate,
        });

        await quote.save();
        res.status(201).json({ success: true, response: quote });
    } catch (error) {
        console.error('Create image error:', error);
        res.status(500).json({ success: false, message: 'Failed to create daily image' });
    }
});

// PUT /api/daily-quotes/:id - Update (admin)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { imageUrl, date, isActive } = req.body;

        const quote = await DailyQuote.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        // If updating image, delete old one from Cloudinary
        if (imageUrl !== undefined && imageUrl !== quote.imageUrl && quote.imageUrl) {
            await deleteFromCloudinary(quote.imageUrl);
        }

        if (imageUrl !== undefined) quote.imageUrl = imageUrl;
        if (date) {
            const quoteDate = new Date(date);
            quoteDate.setHours(0, 0, 0, 0);
            quote.date = quoteDate;
        }
        if (isActive !== undefined) quote.isActive = isActive;

        await quote.save();
        res.json({ success: true, response: quote });
    } catch (error) {
        console.error('Update image error:', error);
        res.status(500).json({ success: false, message: 'Failed to update daily image' });
    }
});

// DELETE /api/daily-quotes/:id - Delete (admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const quote = await DailyQuote.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        // Delete image from Cloudinary
        if (quote.imageUrl) {
            await deleteFromCloudinary(quote.imageUrl);
        }

        await DailyQuote.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete image' });
    }
});

module.exports = router;
