const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('<h1>MediaVault is Live! 🎬</h1>');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Running on port ' + PORT));