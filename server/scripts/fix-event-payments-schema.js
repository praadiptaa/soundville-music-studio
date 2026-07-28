const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('✅ Terhubung ke Supabase PostgreSQL...\n');

  console.log('Memeriksa & menambahkan kolom jumlah_bayar ke tabel event_payments...');

  const queries = [
    'ALTER TABLE event_payments ADD COLUMN IF NOT EXISTS jumlah_bayar DECIMAL(12,2) DEFAULT NULL',
    'ALTER TABLE event_payments ALTER COLUMN metode DROP NOT NULL',
    'ALTER TABLE event_payments ALTER COLUMN bukti_transfer TYPE TEXT'
  ];

  for (const q of queries) {
    try {
      await client.query(q);
      console.log(`  ✅ ${q}`);
    } catch (err) {
      console.log(`  ⚠️ ${q} -> ${err.message}`);
    }
  }

  console.log('\n📋 Schema tabel event_payments saat ini:');
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'event_payments'
    ORDER BY ordinal_position
  `);
  cols.rows.forEach(c => {
    console.log(`  - ${c.column_name}: ${c.data_type} (NULL: ${c.is_nullable})`);
  });

  client.release();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
