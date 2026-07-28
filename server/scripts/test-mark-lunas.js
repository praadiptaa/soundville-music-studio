const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('🔍 Testing markLunas SQL queries against Supabase PostgreSQL...');

  // Test UPDATE query
  try {
    const resUpdate = await client.query(
      "UPDATE event_payments SET status_payment = $1, metode = $2, tipe_pembayaran = 'full_payment', jumlah_bayar = $3 WHERE id_event = $4",
      ['verified', 'qris', 2800000.00, 1]
    );
    console.log('  ✅ UPDATE query succeeded! Rows affected:', resUpdate.rowCount);
  } catch (err) {
    console.error('  ❌ UPDATE query failed:', err.message);
  }

  // Test INSERT query
  try {
    const resInsert = await client.query(
      "INSERT INTO event_payments (id_event, metode, status_payment, tipe_pembayaran, jumlah_bayar) VALUES ($1, $2, $3, 'full_payment', $4) ON CONFLICT (id_event) DO UPDATE SET status_payment = EXCLUDED.status_payment, metode = EXCLUDED.metode",
      [2, 'cash', 'verified', 2100000.00]
    );
    console.log('  ✅ INSERT query succeeded! Rows affected:', resInsert.rowCount);
  } catch (err) {
    console.error('  ❌ INSERT query failed:', err.message);
  }

  client.release();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
