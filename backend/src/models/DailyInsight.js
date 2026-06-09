const mongoose = require('mongoose');
const { i18nSchemaFields } = require('../utils/i18nContent');

const insightSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    userTypes: [{ type: String, enum: ['language_student', 'tourist', 'work_study', 'all'] }],
    title: String,
    titleEn: String,
    titleI18n: i18nSchemaFields,
    description: String,
    descriptionI18n: i18nSchemaFields,
    image: String,
    linkType: String,
    linkId: mongoose.Schema.Types.ObjectId,
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DailyInsight', insightSchema);
