const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('✅ Terhubung ke Supabase...\n');

  // 1. Ubah metode agar boleh NULL (admin set ini saat verifikasi)
  const queries = [
    // Fix NOT NULL constraint
    'ALTER TABLE payments ALTER COLUMN metode DROP NOT NULL',
    'ALTER TABLE event_payments ALTER COLUMN metode DROP NOT NULL',

    // Fix column types ke TEXT (supaya bisa simpan Base64)
    'ALTER TABLE payments ALTER COLUMN bukti_transfer TYPE TEXT',
    'ALTER TABLE event_payments ALTER COLUMN bukti_transfer TYPE TEXT',
    'ALTER TABLE studios ALTER COLUMN foto TYPE TEXT',
    'ALTER TABLE event_equipment ALTER COLUMN gambar TYPE TEXT',
    'ALTER TABLE event_packages ALTER COLUMN gambar TYPE TEXT',
  ];

  for (const q of queries) {
    try {
      await client.query(q);
      console.log(`  ✅ ${q}`);
    } catch (err) {
      console.log(`  ⚠️  SKIP: ${err.message.substring(0, 80)}`);
    }
  }

  // 2. Cek isi kolom foto di studios
  console.log('\n📸 Isi kolom foto di tabel studios:');
  const studios = await client.query('SELECT id_studio, nama_studio, foto FROM studios');
  studios.rows.forEach(s => {
    const fotoType = !s.foto ? 'NULL' : s.foto.startsWith('data:') ? 'Base64' : s.foto.startsWith('http') ? 'URL' : `Path: ${s.foto}`;
    console.log(`  Studio ${s.id_studio} (${s.nama_studio}): ${fotoType}`);
  });

  // 3. Cek schema payments
  console.log('\n📋 Schema tabel payments:');
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'payments'
    ORDER BY ordinal_position
  `);
  cols.rows.forEach(c => {
    console.log(`  ${c.column_name}: ${c.data_type} | NULL: ${c.is_nullable} | DEFAULT: ${c.column_default}`);
  });

  client.release();
  console.log('\n🎉 Selesai!');
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
