const express = require('express');
const Beach = require('../models/Beach');
const GuideArticle = require('../models/GuideArticle');
const { auth, adminOnly } = require('../middleware/auth');
const { getMaltaWeather } = require('../services/weather');
const { resolveLang, localizeDoc, localizeDocs } = require('../utils/i18nContent');

const router = express.Router();

router.get('/beaches', async (req, res) => {
  const lang = resolveLang(req);
  const beaches = await Beach.find().sort({ featured: -1, name: 1 });
  res.json({ beaches: localizeDocs(beaches, lang, ['description']) });
});

router.get('/beaches/:id', async (req, res) => {
  const lang = resolveLang(req);
  const beach = await Beach.findById(req.params.id);
  if (!beach) return res.status(404).json({ message: 'Plaj bulunamadı' });
  res.json({ beach: localizeDoc(beach, lang, ['description']) });
});

router.get('/articles', async (req, res) => {
  const lang = resolveLang(req);
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  const articles = await GuideArticle.find(filter).sort({ order: 1, createdAt: -1 });
  res.json({ articles: localizeDocs(articles, lang, ['title', 'content']) });
});

router.get('/articles/:id', async (req, res) => {
  const lang = resolveLang(req);
  const article = await GuideArticle.findById(req.params.id);
  if (!article) return res.status(404).json({ message: 'Makale bulunamadı' });
  res.json({ article: localizeDoc(article, lang, ['title', 'content']) });
});

router.get('/weather', async (req, res) => {
  const weather = await getMaltaWeather(req.query.lang || 'tr');
  res.json(weather);
});

router.post('/beaches', auth, adminOnly, async (req, res) => {
  const beach = await Beach.create(req.body);
  res.status(201).json({ beach });
});

router.post('/articles', auth, adminOnly, async (req, res) => {
  const article = await GuideArticle.create(req.body);
  res.status(201).json({ article });
});

router.patch('/beaches/:id', auth, adminOnly, async (req, res) => {
  const beach = await Beach.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ beach });
});

router.patch('/articles/:id', auth, adminOnly, async (req, res) => {
  const article = await GuideArticle.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ article });
});

module.exports = router;
