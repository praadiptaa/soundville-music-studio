const dotenv = require('dotenv');
dotenv.config();

let db;

// Deteksi apakah menggunakan Supabase PostgreSQL (via DATABASE_URL atau VERCEL)
if (process.env.DATABASE_URL || process.env.DB_TYPE === 'postgres' || process.env.VERCEL) {
  const { Pool } = require('pg');
  const connectionString = process.env.DATABASE_URL;
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Wrapper agar interface `db.query(sql, params)` kompatibel dengan MySQL promise API
  db = {
    async query(sql, params = []) {
      // Handle MySQL 'INSERT IGNORE INTO' -> PG 'INSERT INTO ... ON CONFLICT DO NOTHING'
      let pgSql = sql;
      let hasInsertIgnore = false;
      if (/INSERT IGNORE INTO/i.test(pgSql)) {
        hasInsertIgnore = true;
        pgSql = pgSql.replace(/INSERT IGNORE INTO/gi, 'INSERT INTO');
      }

      // Format parameter MySQL ? ke PG $1, $2, dst.
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

      if (hasInsertIgnore) {
        pgSql += ' ON CONFLICT DO NOTHING';
      }

      const trimmedSql = pgSql.trim();
      const isInsert = /^insert/i.test(trimmedSql);
      const isUpdateOrDelete = /^(update|delete)/i.test(trimmedSql);

      // Auto RETURNING untuk INSERT query PG agar mendapatkan insertId
      if (isInsert && !/returning/i.test(pgSql)) {
        pgSql += ' RETURNING *';
      }

      try {
        const res = await pool.query(pgSql, params);

        if (isInsert) {
          const firstRow = res.rows[0] || {};
          // Cari primary key yang berawalan id_ (misal: id_user, id_booking, dst)
          const idKey = Object.keys(firstRow).find(k => k.startsWith('id_')) || 'id';
          const insertId = firstRow[idKey] || 0;
          return [{ insertId, affectedRows: res.rowCount }, null];
        }

        if (isUpdateOrDelete) {
          return [{ affectedRows: res.rowCount }, null];
        }

        // Return format array [rows, fields] seperti mysql2
        return [res.rows, res.fields];
      } catch (err) {
        console.error('❌ Error executing PG query:', err.message, 'SQL:', pgSql);
        throw err;
      }
    }
  };
} else {
  // Mode MySQL Bawaan (Lokal / Laragon)
  const mysql2 = require('mysql2');
  const pool = mysql2.createPool({
    host:     process.env.DB_HOST || 'localhost',
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'soundville_db',
    port:     process.env.DB_PORT || 3306,
    timezone: '+07:00', // UTC+7 (Indonesia/Malang)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  db = pool.promise();

  // Test koneksi saat startup
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('❌ Gagal koneksi ke database MySQL:', err.message);
    } else {
      console.log('✅ Koneksi database MySQL berhasil (Timezone: UTC+7)');
      connection.release();
    }
  });
}

module.exports = db;

