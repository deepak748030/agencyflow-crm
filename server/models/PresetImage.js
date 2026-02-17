const mongoose = require('mongoose');

const presetImageSchema = new mongoose.Schema(
    {
        imageUrl: { type: String, required: true },
        publicId: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PresetImage', presetImageSchema);
