const express = require('express');
const { getSqlPool, sql } = require('../config/sql');

const router = express.Router();

// POST /api/users — Create user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'username and email are required' });
    }
    const db = await getSqlPool();

    const existing = await db.request()
      .input('username', sql.VarChar, username)
      .query('SELECT userId FROM Users WHERE username = @username');

    if (existing.recordset.length) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const result = await db.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password || '')
      .input('role', sql.VarChar, role || 'user')
      .query(`
        INSERT INTO Users (username, email, password, role)
        OUTPUT INSERTED.userId, INSERTED.username, INSERTED.email, INSERTED.role, INSERTED.createdAt
        VALUES (@username, @email, @password, @role)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('[POST /users]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login — Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const db = await getSqlPool();
    const result = await db.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM Users WHERE username = @username');

    if (!result.recordset.length) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.recordset[0];

    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Never return password to frontend
    delete user.password;
    res.json(user);
  } catch (err) {
    console.error('[POST /users/login]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users — List all users
router.get('/', async (req, res) => {
  try {
    const db = await getSqlPool();
    const result = await db.request()
      .query('SELECT userId, username, email, role, createdAt FROM Users ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('[GET /users]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — Get one user
router.get('/:id', async (req, res) => {
  try {
    const db = await getSqlPool();
    const result = await db.request()
      .input('userId', sql.Int, parseInt(req.params.id))
      .query('SELECT userId, username, email, role, createdAt FROM Users WHERE userId = @userId');

    if (!result.recordset.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('[GET /users/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/logs — Get audit logs for user
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

// DELETE /api/users/:id — Delete a user (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const db = await getSqlPool();
    await db.request()
      .input('userId', sql.Int, parseInt(req.params.id))
      .query('DELETE FROM AuditLogs WHERE userId = @userId');

    await db.request()
      .input('userId', sql.Int, parseInt(req.params.id))
      .query('DELETE FROM Users WHERE userId = @userId');

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('[DELETE /users/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/role — Change user role (admin only)
router.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const db = await getSqlPool();
    await db.request()
      .input('userId', sql.Int, parseInt(req.params.id))
      .input('role', sql.VarChar, role)
      .query('UPDATE Users SET role = @role WHERE userId = @userId');

    res.json({ message: 'Role updated' });
  } catch (err) {
    console.error('[PUT /users/:id/role]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;