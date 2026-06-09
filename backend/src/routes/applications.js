const express = require('express');
const Application = require('../models/Application');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/mine', auth, async (req, res) => {
  const applications = await Application.find({ user: req.user._id })
    .populate('school', 'name logo city')
    .sort({ createdAt: -1 });
  res.json({ applications });
});

router.get('/:id', auth, async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, user: req.user._id }).populate('school');
  if (!app) return res.status(404).json({ message: 'Başvuru bulunamadı' });
  res.json({ application: app });
});

router.post('/:id/documents', auth, upload.single('file'), async (req, res) => {
  const app = await Application.findOne({ _id: req.params.id, user: req.user._id });
  if (!app) return res.status(404).json({ message: 'Başvuru bulunamadı' });
  app.documents.push({
    name: req.body.name || req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    uploadedAt: new Date(),
  });
  await app.save();
  res.json({ application: app });
});

module.exports = router;
