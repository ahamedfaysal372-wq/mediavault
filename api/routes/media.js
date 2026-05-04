const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { getBlobContainer } = require('../config/blobStorage');
const { getCosmosContainer } = require('../config/cosmos');
const { getSqlPool, sql } = require('../config/sql');

const router = express.Router();

// Multer: store file in memory before uploading to Blob Storage
const upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────────
// POST /api/media  –  Upload a media file
// ─────────────────────────────────────────────
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, description, tags, userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // 1. Upload file to Azure Blob Storage
    const blobContainer = await getBlobContainer();
    const blobName = `${uuidv4()}-${req.file.originalname}`;
    const blockBlobClient = blobContainer.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const blobUrl = blockBlobClient.url;

    // 2. Store metadata in Cosmos DB
    const cosmosContainer = await getCosmosContainer();
    const mediaType = req.file.mimetype.split('/')[0]; // image, video, application
    const mediaDoc = {
      id: uuidv4(),
      title: title || req.file.originalname,
      description: description || '',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      mediaType,
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
      blobName,
      blobUrl,
      fileSize: req.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId || null,
    };

    const { resource: created } = await cosmosContainer.items.create(mediaDoc);

    // 3. Log action in Azure SQL
    if (userId) {
      const db = await getSqlPool();
      await db.request()
        .input('userId', sql.Int, parseInt(userId))
        .input('action', sql.VarChar, 'UPLOAD')
        .input('mediaId', sql.VarChar, created.id)
        .query(`INSERT INTO AuditLogs (userId, action, mediaId) VALUES (@userId, @action, @mediaId)`);
    }

    // Trigger Logic App notification automatically
    if (process.env.LOGIC_APP_URL) {
      fetch(process.env.LOGIC_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ahamedfaysal372@gmail.com',
          message: `New media uploaded: ${mediaDoc.title} (${mediaDoc.mimeType})`,
          triggeredBy: userId || 'unknown'
        })
      }).catch(err => console.error('Logic App trigger failed:', err.message));
    }

    res.status(201).json(created);
  } catch (err) {
    console.error('[POST /media]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/media  –  Retrieve all media
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const cosmosContainer = await getCosmosContainer();
    const { resources } = await cosmosContainer.items
      .query('SELECT * FROM c ORDER BY c.uploadedAt DESC')
      .fetchAll();

    res.json(resources);
  } catch (err) {
    console.error('[GET /media]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/media/:id  –  Retrieve one media item
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const cosmosContainer = await getCosmosContainer();
    const { resources } = await cosmosContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Media not found' });

    res.json(resources[0]);
  } catch (err) {
    console.error('[GET /media/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/media/:id  –  Update media metadata
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { title, description, tags, userId } = req.body;
    const cosmosContainer = await getCosmosContainer();

    // Fetch existing item
    const { resources } = await cosmosContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Media not found' });

    const existing = resources[0];
    const updated = {
      ...existing,
      title: title ?? existing.title,
      description: description ?? existing.description,
      tags: tags ? tags.split(',').map(t => t.trim()) : existing.tags,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await cosmosContainer.items.upsert(updated);

    // Log update in SQL
    if (userId) {
      const db = await getSqlPool();
      await db.request()
        .input('userId', sql.Int, parseInt(userId))
        .input('action', sql.VarChar, 'UPDATE')
        .input('mediaId', sql.VarChar, req.params.id)
        .query(`INSERT INTO AuditLogs (userId, action, mediaId) VALUES (@userId, @action, @mediaId)`);
    }

    res.json(resource);
  } catch (err) {
    console.error('[PUT /media/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/media/:id  –  Delete media + blob
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    const cosmosContainer = await getCosmosContainer();

    // Find the item
    const { resources } = await cosmosContainer.items
      .query({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: req.params.id }] })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Media not found' });

    const mediaDoc = resources[0];

    // 1. Delete blob from Azure Blob Storage
    const blobContainer = await getBlobContainer();
    const blockBlobClient = blobContainer.getBlockBlobClient(mediaDoc.blobName);
    await blockBlobClient.deleteIfExists();

    // 2. Delete metadata from Cosmos DB
    await cosmosContainer.item(mediaDoc.id, mediaDoc.mediaType).delete();

    // 3. Log delete in SQL
    if (userId) {
      const db = await getSqlPool();
      await db.request()
        .input('userId', sql.Int, parseInt(userId))
        .input('action', sql.VarChar, 'DELETE')
        .input('mediaId', sql.VarChar, req.params.id)
        .query(`INSERT INTO AuditLogs (userId, action, mediaId) VALUES (@userId, @action, @mediaId)`);
    }

    res.json({ message: 'Media deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('[DELETE /media/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
