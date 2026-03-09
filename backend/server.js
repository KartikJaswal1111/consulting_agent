require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const chatRoute = require('./routes/chat');
const submitRoute = require('./routes/submit');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow specific origins in production, all in dev
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, direct curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve widget files as static — this is how WordPress loads the embed script
app.use('/widget', express.static(path.join(__dirname, '../widget')));

// API routes
app.use('/api/chat', chatRoute);
app.use('/api/submit', submitRoute);

// Health check — used by Railway/Render for uptime monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'consulting-group-agent', timestamp: new Date().toISOString() });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Consulting Group Backend running on http://localhost:${PORT}`);
  console.log(`Widget served at http://localhost:${PORT}/widget/embed.js`);
});
