const express = require('express');
const Tour = require('../models/Tour');
const School = require('../models/School');
const Beach = require('../models/Beach');
const Event = require('../models/Event');
const GuideArticle = require('../models/GuideArticle');
const DiscountCode = require('../models/DiscountCode');
const AppConfig = require('../models/AppConfig');
const LanguageTestQuestion = require('../models/LanguageTestQuestion');
const { optionalAuth } = require('../middleware/auth');
const { getMaltaWeather } = require('../services/weather');
const { localizeDocs } = require('../utils/i18nContent');
const { serializeEvent } = require('../utils/eventImages');

const router = express.Router();

const HOME_LIMIT = 4;

async function upcomingEvents() {
  return Event.find({ active: true, date: { $gte: new Date() } })
    .sort({ date: 1 })
    .limit(HOME_LIMIT)
    .select('title description date location type');
}

async function homeGuideArticles() {
  return GuideArticle.find()
    .sort({ featured: -1, order: 1, createdAt: -1 })
    .limit(HOME_LIMIT)
    .select('title category images');
}

async function activeDiscountCodes() {
  return DiscountCode.find({ active: true })
    .select('code percent fixedAmount earlyBird forTurkish')
    .sort({ createdAt: -1 })
    .limit(HOME_LIMIT);
}

async function homeSectionsForUserType(userType) {
  if (userType === 'language_student') {
    const [schools, events, guideArticles, discountCodes] = await Promise.all([
      School.find({ active: true }).sort({ featured: -1, rating: -1 }).limit(HOME_LIMIT),
      upcomingEvents(),
      homeGuideArticles(),
      activeDiscountCodes(),
    ]);
    return { schools, events, guideArticles, discountCodes };
  }

  if (userType === 'tourist') {
    const [tours, beaches, guideArticles, events, discountCodes] = await Promise.all([
      Tour.find({ active: true }).sort({ featured: -1, createdAt: -1, rating: -1 }).limit(HOME_LIMIT),
      Beach.find().sort({ featured: -1, name: 1 }).limit(HOME_LIMIT),
      homeGuideArticles(),
      upcomingEvents(),
      activeDiscountCodes(),
    ]);
    return { tours, beaches, guideArticles, events, discountCodes };
  }

  const [guideArticles, schools, events] = await Promise.all([
    homeGuideArticles(),
    School.find({ active: true })
      .sort({ featured: -1, rating: -1 })
      .limit(HOME_LIMIT),
    upcomingEvents(),
  ]);
  return { guideArticles, schools, events };
}

router.get('/home', optionalAuth, async (req, res) => {
  const userType = req.query.userType || req.user?.userType || 'tourist';
  const lang = req.query.lang || req.user?.language || 'tr';

  const [sections, weather] = await Promise.all([
    homeSectionsForUserType(userType),
    getMaltaWeather(lang),
  ]);

  const config = await AppConfig.findOne({ key: 'main' });
  const quickActions = (config?.quickLinks || [])
    .slice(0, 4)
    .map((l) => ({ id: l.label, label: l.label, url: l.url, icon: l.icon }));

  res.json({
    userType,
    weather: {
      temp: weather.temp,
      condition: weather.condition,
      conditionText: weather.conditionText,
      seaTemp: weather.seaTemp,
      humidity: weather.humidity,
      windKmh: weather.windKmh,
      source: weather.source || 'live',
    },
    schools: localizeDocs(sections.schools || [], lang, ['description']),
    tours: localizeDocs(sections.tours || [], lang, ['title', 'description']),
    beaches: localizeDocs(sections.beaches || [], lang, ['description']),
    guideArticles: localizeDocs(sections.guideArticles || [], lang, ['title', 'content']),
    events: (sections.events || []).map((e) => {
      const o = e.toObject ? e.toObject() : e;
      return serializeEvent(o);
    }),
    discountCodes: sections.discountCodes || [],
    quickActions,
  });
});

router.post('/chatbot', async (req, res) => {
  const { message, language = 'tr' } = req.body;
  const config = await AppConfig.findOne({ key: 'main' });
  const welcome = config?.chatbotWelcome?.[language] || config?.chatbotWelcome?.tr;
  const replies = {
    tr: welcome || `Merhaba! "${message}" için Turlar, Okullar veya Yaşam Rehberi sekmelerine bakın. Canlı destek için Destek sohbetini açın.`,
    en: welcome || `Hello! For "${message}" check Tours, Schools, or Life Guide. Open Support chat for live help.`,
    de: welcome || `Hallo! Für "${message}" siehe Touren und Schulen.`,
    ar: welcome || `مرحباً! راجع الجولات والمدارس.`,
    es: welcome || `¡Hola! Revisa Tours y Escuelas.`,
  };
  const suggestions = {
    tr: ['Turlar', 'Okullar', 'Plajlar', 'Canlı destek'],
    en: ['Tours', 'Schools', 'Beaches', 'Live support'],
    de: ['Touren', 'Schulen', 'Strände', 'Support'],
    ar: ['جولات', 'مدارس', 'شواطئ', 'دعم'],
    es: ['Tours', 'Escuelas', 'Playas', 'Soporte'],
  };
  res.json({
    reply: replies[language] || replies.tr,
    suggestions: suggestions[language] || suggestions.tr,
    supportRoomId: config?.supportRoomId,
  });
});

router.get('/budget-calculator', (req, res) => {
  const weeks = Number(req.query.weeks) || 4;
  const schoolPerWeek = Number(req.query.schoolPerWeek) || 180;
  const accommodation = Number(req.query.accommodation) || 400;
  const tours = Number(req.query.tours) || 150;
  const food = Number(req.query.food) || 300;
  const transport = Number(req.query.transport) || 50;

  const total = weeks * schoolPerWeek + accommodation + tours + food + transport;
  res.json({
    breakdown: {
      school: weeks * schoolPerWeek,
      accommodation,
      tours,
      food,
      transport,
    },
    total,
    currency: 'EUR',
    weeks,
  });
});

router.get('/language-test', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 20);
  const rows = await LanguageTestQuestion.find({ active: true }).sort({ order: 1 }).limit(limit);
  const questions = rows.map((q, i) => ({
    id: q._id,
    question: q.questionEn || q.question,
    options: q.options,
    order: i,
  }));
  res.json({ questions, total: questions.length });
});

router.post('/language-test/submit', async (req, res) => {
  const submitted = req.body.answers || [];
  const ids = submitted.map((a) => a.questionId).filter(Boolean);
  const rows = await LanguageTestQuestion.find({ _id: { $in: ids }, active: true });
  const byId = Object.fromEntries(rows.map((r) => [String(r._id), r]));

  let score = 0;
  const wrong = [];
  for (const a of submitted) {
    const row = byId[String(a.questionId)];
    if (!row) continue;
    const selected = Number(a.selectedIndex);
    const correct = row.answerIndex;
    if (selected === correct) {
      score += 1;
    } else {
      wrong.push({
        id: row._id,
        question: row.questionEn || row.question,
        options: row.options,
        selectedIndex: selected,
        correctIndex: correct,
      });
    }
  }

  const total = submitted.length;
  let level = 'A1';
  if (total >= 8 && score >= 8) level = 'B1+';
  else if (total >= 6 && score >= 6) level = 'B1';
  else if (total >= 4 && score >= 4) level = 'A2';

  res.json({ score, total, level, wrong });
});

module.exports = router;
