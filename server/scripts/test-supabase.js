const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('Menghubungkan ke Supabase Pooler (ap-northeast-2)...');
    const client = await pool.connect();
    console.log('✅ BERHASIL TERHUBUNG KE SUPABASE POSTGRESQL!');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nTabel yang ditemukan di Supabase:');
    res.rows.forEach(r => console.log('  - ' + r.table_name));

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error koneksi:', err.message);
    process.exit(1);
  }
}

testConnection();
