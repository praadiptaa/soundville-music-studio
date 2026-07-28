const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('🔍 Checking payments table...');
  const res = await client.query('SELECT id_payment, id_booking, bukti_transfer, status_payment, metode FROM payments');
  console.log('Payments count:', res.rows.length);
  res.rows.forEach(r => {
    const proofType = !r.bukti_transfer ? 'NULL' : r.bukti_transfer.startsWith('data:') ? 'Base64' : r.bukti_transfer.startsWith('http') ? 'URL' : `Path: ${r.bukti_transfer}`;
    console.log(`  Payment #${r.id_payment} (Booking #${r.id_booking}): status=${r.status_payment}, metode=${r.metode}, proof=${proofType}`);
    if (proofType.startsWith('Path:')) {
      console.log(`    Exact proof value: "${r.bukti_transfer}"`);
    }
  });

  console.log('\n🔍 Checking event_payments table...');
  const resEvt = await client.query('SELECT id_event_payment, id_event, bukti_transfer, status_payment, metode FROM event_payments');
  console.log('Event Payments count:', resEvt.rows.length);
  resEvt.rows.forEach(r => {
    const proofType = !r.bukti_transfer ? 'NULL' : r.bukti_transfer.startsWith('data:') ? 'Base64' : r.bukti_transfer.startsWith('http') ? 'URL' : `Path: ${r.bukti_transfer}`;
    console.log(`  Event Payment #${r.id_event_payment} (Event #${r.id_event}): status=${r.status_payment}, metode=${r.metode}, proof=${proofType}`);
    if (proofType.startsWith('Path:')) {
      console.log(`    Exact proof value: "${r.bukti_transfer}"`);
    }
  });

  client.release();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
