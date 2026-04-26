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
app.use(express.static('/home/site/wwwroot/api/public'));

// API Routes
app.use('/api/media', mediaRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MediaVault API',
    timestamp: new Date().toISOString(),
  });
});
// Serve frontend inline
app.get('/', (req, res) => {
  const fs = require('fs');
  const paths = [
    '/home/site/wwwroot/api/public/index.html',
    path.join(__dirname, 'public', 'index.html'),
    path.join(process.cwd(), 'api', 'public', 'index.html'),
  ];
  
  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log('Serving from:', p);
      return res.sendFile(p);
    }
  }
  
  res.send('MediaVault API is running! Frontend not found. CWD: ' + process.cwd());
});
// Fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile('/home/site/wwwroot/api/public/index.html');
});

const PORT = process.env.PORT || 8080;

async function start() {
  try {
    await initSqlSchema();
    app.listen(PORT, () => {
      console.log(`✅ MediaVault API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

start();
module.exports = app;