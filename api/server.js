const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Frontend
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MediaVault API' });
});

// Routes
app.use('/api/media', require('./routes/media'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notify', require('./routes/notify'));

// Proxy to Azure Function
app.get('/api/stats', async (req, res) => {
  try {
    const fnUrl = process.env.MEDIA_STATS_FUNCTION_URL;
    if (!fnUrl) return res.json({ error: 'Function not configured' });
    
    const https = require('https');
    const url = new URL(fnUrl);
    
    https.get({
      hostname: url.hostname,
      path: url.pathname + url.search,
    }, (fnRes) => {
      let data = '';
      fnRes.on('data', chunk => data += chunk);
      fnRes.on('end', () => {
        try {
          res.json(JSON.parse(data));
        } catch(e) {
          res.status(500).json({ error: e.message });
        }
      });
    }).on('error', (e) => res.status(500).json({ error: e.message }));
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ MediaVault running on port ${PORT}`));
module.exports = app;