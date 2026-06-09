const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail, appBase } = require('../services/email');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const userPayload = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  userType: user.userType,
  role: user.role,
  language: user.language,
  emailVerified: user.emailVerified,
});

const tokenExpiry = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, userType, language, country } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      email,
      password,
      name,
      userType,
      language,
      country,
      emailVerified: false,
      verificationToken,
      verificationTokenExpires: tokenExpiry(24),
    });

    await sendVerificationEmail(user, verificationToken);

    const devLink =
      process.env.NODE_ENV !== 'production'
        ? `${appBase()}/verify-email?token=${verificationToken}`
        : undefined;

    res.status(201).json({
      message: 'Kayıt başarılı. Lütfen e-postanızdaki doğrulama bağlantısına tıklayın.',
      user: userPayload(user),
      devVerifyLink: devLink,
    });
  }
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await user.comparePassword(req.body.password))) {
    return res.status(401).json({ message: 'E-posta veya şifre hatalı' });
  }

  if (!user.emailVerified && user.role === 'user') {
    if (!user.verificationToken) {
      user.emailVerified = true;
      await user.save();
    } else {
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'E-posta adresiniz doğrulanmamış. Gelen kutunuzu kontrol edin.',
      });
    }
  }

  const token = signToken(user._id);
  res.json({ token, user: userPayload(user) });
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Token gerekli' });

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş bağlantı' });

  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({ message: 'E-posta doğrulandı. Giriş yapabilirsiniz.', verified: true });
});

router.post('/verify-email', [body('token').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await User.findOne({
    verificationToken: req.body.token,
    verificationTokenExpires: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş bağlantı' });

  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({ message: 'E-posta doğrulandı', verified: true });
});

router.post('/resend-verification', [body('email').isEmail()], async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || user.emailVerified) {
    return res.json({ message: 'Doğrulama e-postası gönderildi (varsa)' });
  }

  user.verificationToken = crypto.randomBytes(32).toString('hex');
  user.verificationTokenExpires = tokenExpiry(24);
  await user.save();
  await sendVerificationEmail(user, user.verificationToken);

  const devLink =
    process.env.NODE_ENV !== 'production'
      ? `${appBase()}/verify-email?token=${user.verificationToken}`
      : undefined;

  res.json({ message: 'Doğrulama e-postası gönderildi', devVerifyLink: devLink });
});

router.post('/forgot-password', [body('email').isEmail()], async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    user.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordExpires = tokenExpiry(1);
    await user.save();
    await sendPasswordResetEmail(user, user.resetPasswordToken);
  }
  res.json({
    message: 'Şifre sıfırlama bağlantısı e-postanıza gönderildi (kayıtlıysa).',
    devResetLink:
      user && process.env.NODE_ENV !== 'production'
        ? `${appBase()}/reset-password?token=${user.resetPasswordToken}`
        : undefined,
  });
});

router.post(
  '/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = await User.findOne({
      resetPasswordToken: req.body.token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş bağlantı' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Şifreniz güncellendi. Giriş yapabilirsiniz.' });
  }
);

router.get('/me', auth, async (req, res) => {
  res.json({ user: userPayload(req.user) });
});

router.patch('/me', auth, async (req, res) => {
  const allowed = ['name', 'phone', 'userType', 'language', 'country', 'city', 'pushToken', 'avatar'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  });
  await req.user.save();
  res.json({ user: userPayload(req.user) });
});

module.exports = router;
