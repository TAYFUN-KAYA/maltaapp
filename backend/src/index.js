require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./config/db');
const setupSocket = require('./socket');

const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/schools');
const tourRoutes = require('./routes/tours');
const guideRoutes = require('./routes/guide');
const communityRoutes = require('./routes/community');
const discoverRoutes = require('./routes/discover');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const configRoutes = require('./routes/config');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);

const corsOrigins = (process.env.CORS_ORIGIN || '*').split(',');
const io = new Server(server, { cors: { origin: corsOrigins, credentials: true } });

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'MaltaStart API' }));

app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/guide', guideRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/config', configRoutes);
app.use('/api/upload', uploadRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Sunucu hatası' });
});

setupSocket(io);
require('./socket/io').setIo(io);

const PORT = process.env.PORT || 3000;

const { logEmailStatus } = require('./services/email');

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`MaltaStart API http://localhost:${PORT}`);
      logEmailStatus().catch((err) => console.error('[email] durum kontrolü:', err.message));
    });
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
