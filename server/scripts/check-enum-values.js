const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('🔍 Checking enum values for tipe_pembayaran_type in PostgreSQL...');

  const res = await client.query(`
    SELECT enumlabel
    FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'tipe_pembayaran_type'
  `);

  console.log('Allowed enum values in tipe_pembayaran_type:', res.rows.map(r => r.enumlabel));

  client.release();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
