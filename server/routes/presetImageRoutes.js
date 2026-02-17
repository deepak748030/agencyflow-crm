const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Admin = require('../models/Admin');
const PresetImage = require('../models/PresetImage');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ success: false, message: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!admin) return res.status(401).json({ success: false, message: 'Unauthorized' });
        req.admin = admin;
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// POST /api/preset-images/upload — admin upload
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No image file' });

        const b64 = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'preset-images',
            resource_type: 'image',
        });

        const count = await PresetImage.countDocuments();
        const preset = new PresetImage({
            imageUrl: result.secure_url,
            publicId: result.public_id,
            order: count,
        });
        await preset.save();

        res.json({ success: true, response: preset });
    } catch (error) {
        console.error('Preset image upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// GET /api/preset-images — public list (for app)
router.get('/', async (req, res) => {
    try {
        const images = await PresetImage.find({ isActive: true }).sort({ order: 1 });
        res.json({ success: true, response: images });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch images' });
    }
});

// GET /api/preset-images/admin — admin list (all)
router.get('/admin', authMiddleware, async (req, res) => {
    try {
        const images = await PresetImage.find().sort({ order: 1 });
        res.json({ success: true, response: images });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch images' });
    }
});

// DELETE /api/preset-images/:id — admin delete
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const image = await PresetImage.findById(req.params.id);
        if (!image) return res.status(404).json({ success: false, message: 'Not found' });

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(image.publicId);
        await PresetImage.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        console.error('Delete preset error:', error);
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
});

module.exports = router;
