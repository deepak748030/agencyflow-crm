const mongoose = require('mongoose');

const homeContentSchema = new mongoose.Schema({
    title_hi: {
        type: String,
        default: '',
    },
    title_en: {
        type: String,
        default: '',
    },
    subtitle_hi: {
        type: String,
        default: '',
    },
    subtitle_en: {
        type: String,
        default: '',
    },
    paragraphs_hi: {
        type: [String],
        default: [],
    },
    paragraphs_en: {
        type: [String],
        default: [],
    },
    bannerImages: {
        type: [String],
        default: [],
    },
    sidebarImage: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('HomeContent', homeContentSchema);
