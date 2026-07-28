const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:smsbugenvil2025@db.kmhqsuzeuekgbpzumkno.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('Menghubungkan ke Supabase PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Berhasil terhubung ke Supabase!');

    // Cek daftar tabel
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nTabel yang ditemukan di Supabase:');
    if (res.rows.length === 0) {
      console.log('⚠️ Belum ada tabel. Pastikan Anda sudah me-run script supabase_schema.sql di SQL Editor Supabase!');
    } else {
      res.rows.forEach(r => console.log('  - ' + r.table_name));
    }

    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error koneksi ke Supabase:', err.message);
    process.exit(1);
  }
}

testConnection();
