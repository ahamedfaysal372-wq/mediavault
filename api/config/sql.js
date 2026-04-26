const sql = require('mssql');

let pool;

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: true,           // Required for Azure SQL
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function getSqlPool() {
  if (pool) return pool;
  pool = await sql.connect(sqlConfig);
  console.log('[SQL] Connected to Azure SQL Database');
  return pool;
}

// Create tables on startup if they don't exist
async function initSqlSchema() {
  const db = await getSqlPool();

  await db.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
    CREATE TABLE Users (
      userId    INT IDENTITY(1,1) PRIMARY KEY,
      username  VARCHAR(100) NOT NULL,
      email     VARCHAR(200) NOT NULL,
      createdAt DATETIME DEFAULT GETDATE()
    )
  `);

  await db.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLogs' AND xtype='U')
    CREATE TABLE AuditLogs (
      logId     INT IDENTITY(1,1) PRIMARY KEY,
      userId    INT REFERENCES Users(userId),
      action    VARCHAR(50) NOT NULL,
      mediaId   VARCHAR(200),
      timestamp DATETIME DEFAULT GETDATE()
    )
  `);

  console.log('[SQL] Schema initialised (Users + AuditLogs tables ready)');
}

module.exports = { getSqlPool, initSqlSchema, sql };
