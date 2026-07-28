const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('✅ Terhubung ke Supabase PostgreSQL...\n');

  console.log('1. Menambahkan "operator" ke enum role_type...');
  try {
    await client.query("ALTER TYPE role_type ADD VALUE IF NOT EXISTS 'operator'");
    console.log("  ✅ ALTER TYPE role_type ADD VALUE 'operator' SUCCEEDED!");
  } catch (err) {
    console.log(`  ⚠️ ${err.message}`);
  }

  console.log('\n2. Membuat tabel operator_shifts...');
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS operator_shifts (
        id_shift        SERIAL PRIMARY KEY,
        id_user         INT NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
        tanggal         DATE NOT NULL,
        jam_mulai       TIME NOT NULL,
        jam_selesai     TIME NOT NULL,
        status_shift    VARCHAR(50) DEFAULT 'scheduled',
        catatan         TEXT DEFAULT NULL,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ CREATE TABLE operator_shifts SUCCEEDED!');
  } catch (err) {
    console.error('  ❌ CREATE TABLE operator_shifts FAILED:', err.message);
  }

  console.log('\n📋 Memeriksa struktur tabel operator_shifts:');
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'operator_shifts'
    ORDER BY ordinal_position
  `);
  cols.rows.forEach(c => {
    console.log(`  - ${c.column_name}: ${c.data_type} (NULL: ${c.is_nullable})`);
  });

  client.release();
  console.log('\n🎉 Selesai migrasi database untuk fitur Operator!');
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
