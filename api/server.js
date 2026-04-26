// App Insights MUST be first
const { initAppInsights } = require('./config/appInsights');
initAppInsights();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { initSqlSchema } = require('./config/sql');
const mediaRoutes = require('./routes/media');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/media', mediaRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MediaVault API', timestamp: new Date().toISOString() });
});

// Fallback to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initSqlSchema();
    app.listen(PORT, () => console.log(`✅ MediaVault API running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

start();
module.exports = app;
