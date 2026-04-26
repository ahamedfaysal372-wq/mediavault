const express = require('express');
const { getSqlPool, sql } = require('../config/sql');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/users  –  Create a new user
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'username and email are required' });
    }

    const db = await getSqlPool();
    const result = await db.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .query(`
        INSERT INTO Users (username, email)
        OUTPUT INSERTED.*
        VALUES (@username, @email)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('[POST /users]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/users  –  List all users
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db = await getSqlPool();
    const result = await db.request().query('SELECT * FROM Users ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('[GET /users]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/users/:id  –  Get one user
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const db = await getSqlPool();
    const result = await db.request()
      .input('userId', sql.Int, parseInt(req.params.id))
      .query('SELECT * FROM Users WHERE userId = @userId');

    if (!result.recordset.length) return res.status(404).json({ error: 'User not found' });

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('[GET /users/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/users/:id/logs  –  Get user audit logs
// ─────────────────────────────────────────────
router.get('/:id/logs', async (req, res) => {
  try {
    const db = await getSqlPool();
    const result = await db.request()
      .input('userId', sql.Int, parseInt(req.params.id))
      .query(`
        SELECT l.logId, l.action, l.mediaId, l.timestamp, u.username
        FROM AuditLogs l
        JOIN Users u ON l.userId = u.userId
        WHERE l.userId = @userId
        ORDER BY l.timestamp DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('[GET /users/:id/logs]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
