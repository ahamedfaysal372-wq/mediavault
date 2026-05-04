const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { email, message, triggeredBy } = req.body;
    const logicAppUrl = process.env.LOGIC_APP_URL;

    if (!logicAppUrl) {
      return res.status(400).json({ error: 'LOGIC_APP_URL not configured' });
    }

    const response = await fetch(logicAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message, triggeredBy })
    });

    if (!response.ok) throw new Error('Logic App trigger failed');

    res.json({ success: true, message: 'Notification sent' });
  } catch (err) {
    console.error('[POST /notify]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;