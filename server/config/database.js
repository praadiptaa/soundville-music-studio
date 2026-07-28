const dotenv = require('dotenv');
dotenv.config();

let db;

// Supabase PostgreSQL Connection String (Default Fallback untuk Vercel Production)
const DEFAULT_SUPABASE_URL = 'postgresql://postgres:smsbugenvil2025@db.kmhqsuzeuekgbpzumkno.supabase.co:5432/postgres';

const connectionString = process.env.DATABASE_URL || DEFAULT_SUPABASE_URL;
const isPg = Boolean(connectionString && connectionString.startsWith('postgres'));

if (isPg || process.env.DB_TYPE === 'postgres' || process.env.VERCEL) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  db = {
    async query(sql, params = []) {
      let pgSql = sql;
      let hasInsertIgnore = false;
      if (/INSERT IGNORE INTO/i.test(pgSql)) {
        hasInsertIgnore = true;
        pgSql = pgSql.replace(/INSERT IGNORE INTO/gi, 'INSERT INTO');
      }

      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

      if (hasInsertIgnore) {
        pgSql += ' ON CONFLICT DO NOTHING';
      }

      const trimmedSql = pgSql.trim();
      const isInsert = /^insert/i.test(trimmedSql);
      const isUpdateOrDelete = /^(update|delete)/i.test(trimmedSql);

      if (isInsert && !/returning/i.test(pgSql)) {
        pgSql += ' RETURNING *';
      }

      try {
        const res = await pool.query(pgSql, params);

        if (isInsert) {
          const firstRow = res.rows[0] || {};
          const idKey = Object.keys(firstRow).find(k => k.startsWith('id_')) || 'id';
          const insertId = firstRow[idKey] || 0;
          return [{ insertId, affectedRows: res.rowCount }, null];
        }

        if (isUpdateOrDelete) {
          return [{ affectedRows: res.rowCount }, null];
        }

        return [res.rows, res.fields];
      } catch (err) {
        console.error('❌ Error executing PG query:', err.message, 'SQL:', pgSql);
        throw err;
      }
    }
  };
} else {
  // Mode MySQL Bawaan (Lokal)
  const mysql2 = require('mysql2');
  const pool = mysql2.createPool({
    host:     process.env.DB_HOST || 'localhost',
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'soundville_db',
    port:     process.env.DB_PORT || 3306,
    timezone: '+07:00',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  db = pool.promise();
}

module.exports = db;
