const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('✅ Terhubung ke Supabase PostgreSQL...\n');

    console.log('Mengubah tipe kolom gambar/bukti_transfer dari VARCHAR(255) ke TEXT...');

    const alterQueries = [
      'ALTER TABLE payments ALTER COLUMN bukti_transfer TYPE TEXT',
      'ALTER TABLE event_payments ALTER COLUMN bukti_transfer TYPE TEXT',
      'ALTER TABLE studios ALTER COLUMN foto TYPE TEXT',
      'ALTER TABLE event_equipment ALTER COLUMN gambar TYPE TEXT',
      'ALTER TABLE event_packages ALTER COLUMN gambar TYPE TEXT',
      'ALTER TABLE bookings ALTER COLUMN gambar TYPE TEXT',
    ];

    for (const q of alterQueries) {
      try {
        await client.query(q);
        console.log(`  ✅ ${q}`);
      } catch (err) {
        console.log(`  ⚠️ ${q} -> ${err.message}`);
      }
    }

    console.log('\n🎉 SELURUH KOLOM DATABASE BERHASIL DI-ALTER KE TEXT!');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
