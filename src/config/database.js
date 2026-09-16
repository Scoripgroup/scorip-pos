require('dotenv').config();
const knex = require('knex');
const path = require('path');
const fs = require('fs');

const dbClient = process.env.DB_CLIENT || 'sqlite';

let knexConfig = {};

if (dbClient === 'pg' || process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  knexConfig = {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'scorip_pos',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: { min: 2, max: 10 }
  };
} else {
  // Default development: SQLite3
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = process.env.DB_PATH || path.join(dataDir, 'scorip-pos.db');

  knexConfig = {
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    }
  };
}

const db = knex(knexConfig);

module.exports = db;
