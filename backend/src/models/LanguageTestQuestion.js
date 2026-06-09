const mongoose = require('mongoose');

const languageTestSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    questionEn: String,
    options: [String],
    answerIndex: { type: Number, required: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LanguageTestQuestion', languageTestSchema);
