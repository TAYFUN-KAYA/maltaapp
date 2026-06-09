const mongoose = require('mongoose');
const { i18nSchemaFields } = require('../utils/i18nContent');

const appConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    emergencyPage: {
      title: String,
      subtitle: String,
      body: String,
      titleI18n: i18nSchemaFields,
      subtitleI18n: i18nSchemaFields,
      bodyI18n: i18nSchemaFields,
    },
    emergencyInfoSections: [
      {
        title: String,
        body: String,
        titleI18n: i18nSchemaFields,
        bodyI18n: i18nSchemaFields,
        icon: { type: String, default: 'information-circle' },
        order: { type: Number, default: 0 },
        enabled: { type: Boolean, default: true },
      },
    ],
    emergencyContacts: [
      {
        label: String,
        labelI18n: i18nSchemaFields,
        number: String,
        icon: { type: String, default: 'call' },
        order: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
      },
    ],
    liveChat: {
      enabled: { type: Boolean, default: true },
      title: String,
      subtitle: String,
      titleI18n: i18nSchemaFields,
      subtitleI18n: i18nSchemaFields,
    },
    callSupport: {
      enabled: { type: Boolean, default: true },
      title: String,
      titleI18n: i18nSchemaFields,
    },
    quickLinks: [{ label: String, url: String, icon: String, category: String, order: Number }],
    chatbotWelcome: { tr: String, en: String, de: String, ar: String, es: String },
    supportRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityRoom' },
    supportPhone: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppConfig', appConfigSchema);
