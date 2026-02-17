const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Admin = require('../models/Admin');
const HomeContent = require('../models/HomeContent');
const router = express.Router();

// Multer config
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    },
});

// Upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'home-banners', resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
            (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(buffer);
    });
};

// Delete from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
    try {
        const parts = imageUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return;
        const pathParts = parts.slice(uploadIndex + 2);
        const publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary delete error:', error.message);
    }
};

// Auth middleware
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

// GET /api/home-content - Public: get home content
router.get('/', async (req, res) => {
    try {
        const content = await HomeContent.findOne().sort({ updatedAt: -1 });
        if (!content) {
            return res.json({ success: true, response: null });
        }
        res.json({
            success: true,
            response: {
                _id: content._id,
                title_hi: content.title_hi,
                title_en: content.title_en,
                subtitle_hi: content.subtitle_hi,
                subtitle_en: content.subtitle_en,
                paragraphs_hi: content.paragraphs_hi,
                paragraphs_en: content.paragraphs_en,
                bannerImages: content.bannerImages || [],
                sidebarImage: content.sidebarImage || '',
                updatedAt: content.updatedAt,
            },
        });
    } catch (error) {
        console.error('Get home content error:', error);
        res.status(500).json({ success: false, message: 'Failed to get home content' });
    }
});

// POST /api/home-content - Admin: create or update home content
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title_hi, title_en, subtitle_hi, subtitle_en, paragraphs_hi, paragraphs_en } = req.body;

        let content = await HomeContent.findOne();
        if (content) {
            content.title_hi = title_hi || '';
            content.title_en = title_en || '';
            content.subtitle_hi = subtitle_hi || '';
            content.subtitle_en = subtitle_en || '';
            content.paragraphs_hi = paragraphs_hi || [];
            content.paragraphs_en = paragraphs_en || [];
            await content.save();
        } else {
            content = new HomeContent({
                title_hi: title_hi || '',
                title_en: title_en || '',
                subtitle_hi: subtitle_hi || '',
                subtitle_en: subtitle_en || '',
                paragraphs_hi: paragraphs_hi || [],
                paragraphs_en: paragraphs_en || [],
            });
            await content.save();
        }

        res.json({
            success: true,
            message: 'Home content updated',
            response: content,
        });
    } catch (error) {
        console.error('Save home content error:', error);
        res.status(500).json({ success: false, message: 'Failed to save home content' });
    }
});

// POST /api/home-content/banner/upload - Upload banner image (admin)
router.post('/banner/upload', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const result = await uploadToCloudinary(req.file.buffer);
        const imageUrl = result.secure_url;

        // Add to bannerImages array
        let content = await HomeContent.findOne();
        if (!content) {
            content = new HomeContent({ bannerImages: [imageUrl] });
        } else {
            content.bannerImages.push(imageUrl);
        }
        await content.save();

        res.json({
            success: true,
            response: { imageUrl, bannerImages: content.bannerImages },
        });
    } catch (error) {
        console.error('Banner upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload banner image' });
    }
});

// DELETE /api/home-content/banner - Delete banner image (admin)
router.delete('/banner', authMiddleware, async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ success: false, message: 'imageUrl is required' });
        }

        const content = await HomeContent.findOne();
        if (!content) {
            return res.status(404).json({ success: false, message: 'No home content found' });
        }

        content.bannerImages = content.bannerImages.filter(url => url !== imageUrl);
        await content.save();

        // Delete from Cloudinary
        await deleteFromCloudinary(imageUrl);

        res.json({
            success: true,
            message: 'Banner image deleted',
            response: { bannerImages: content.bannerImages },
        });
    } catch (error) {
        console.error('Banner delete error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete banner image' });
    }
});

// POST /api/home-content/sidebar-image/upload - Upload sidebar image (admin)
router.post('/sidebar-image/upload', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const result = await uploadToCloudinary(req.file.buffer);
        const imageUrl = result.secure_url;

        let content = await HomeContent.findOne();
        if (!content) {
            content = new HomeContent({ sidebarImage: imageUrl });
        } else {
            // Delete old sidebar image from Cloudinary if exists
            if (content.sidebarImage) {
                await deleteFromCloudinary(content.sidebarImage);
            }
            content.sidebarImage = imageUrl;
        }
        await content.save();

        res.json({
            success: true,
            response: { sidebarImage: content.sidebarImage },
        });
    } catch (error) {
        console.error('Sidebar image upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload sidebar image' });
    }
});

// DELETE /api/home-content/sidebar-image - Delete sidebar image (admin)
router.delete('/sidebar-image', authMiddleware, async (req, res) => {
    try {
        const content = await HomeContent.findOne();
        if (!content || !content.sidebarImage) {
            return res.status(404).json({ success: false, message: 'No sidebar image found' });
        }

        await deleteFromCloudinary(content.sidebarImage);
        content.sidebarImage = '';
        await content.save();

        res.json({
            success: true,
            message: 'Sidebar image deleted',
        });
    } catch (error) {
        console.error('Sidebar image delete error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete sidebar image' });
    }
});

module.exports = router;
