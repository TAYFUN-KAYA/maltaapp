const mongoose = require('mongoose');
const { i18nSchemaFields } = require('../utils/i18nContent');

const guideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    titleI18n: i18nSchemaFields,
    slug: String,
    category: {
      type: String,
      enum: ['beach', 'attraction', 'food', 'transport', 'practical', 'seasonal'],
      required: true,
    },
    content: { type: String, required: true },
    contentEn: String,
    contentI18n: i18nSchemaFields,
    images: [String],
    tags: [String],
    externalLinks: [{ label: String, url: String }],
    featured: Boolean,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GuideArticle', guideSchema);
