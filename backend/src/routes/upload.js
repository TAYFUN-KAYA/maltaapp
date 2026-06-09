const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = /^(image\/(jpeg|png|gif|webp|avif|svg\+xml)|application\/pdf)$/;

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED_MIME.test(file.mimetype);
    cb(ok ? null : new Error('Desteklenmeyen dosya tipi'), ok);
  },
});

function handleUpload(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Dosya boyutu en fazla 8 MB olabilir' });
        }
        return res.status(400).json({ message: err.message });
      }
      if (err.message === 'Desteklenmeyen dosya tipi') {
        return res.status(400).json({
          message: 'Desteklenmeyen dosya tipi. JPEG, PNG, GIF, WebP, AVIF, SVG veya PDF yükleyin.',
        });
      }
      next(err);
    });
  };
}

function fileUrl(req, filename) {
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
}

router.post('/', auth, handleUpload(upload.single('file')), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Dosya gerekli' });
  res.status(201).json({
    url: fileUrl(req, req.file.filename),
    path: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

router.post('/admin', auth, adminOnly, handleUpload(upload.single('file')), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Dosya gerekli' });
  res.status(201).json({
    url: fileUrl(req, req.file.filename),
    path: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

module.exports = router;
