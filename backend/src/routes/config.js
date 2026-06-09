const express = require('express');
const AppConfig = require('../models/AppConfig');
const CommunityRoom = require('../models/CommunityRoom');
const { resolveLang } = require('../utils/i18nContent');
const { buildPublicEmergency } = require('../utils/emergencyConfig');

const router = express.Router();

router.get('/public', async (req, res) => {
  const lang = resolveLang(req);
  let config = await AppConfig.findOne({ key: 'main' });
  if (!config) {
    config = await AppConfig.create({ key: 'main', emergencyContacts: [], quickLinks: [] });
  }
  let supportRoom = null;
  if (config.supportRoomId) {
    supportRoom = await CommunityRoom.findById(config.supportRoomId).select('_id name');
  }

  const emergency = buildPublicEmergency(config, lang);

  res.json({
    ...emergency,
    supportRoom,
    supportRoomId: supportRoom?._id ? String(supportRoom._id) : null,
    quickLinks: (config.quickLinks || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
    chatbotWelcome: config.chatbotWelcome || {},
  });
});

module.exports = router;
