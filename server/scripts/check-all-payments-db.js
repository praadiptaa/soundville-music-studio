const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('🔍 Checking ALL payments table rows...');
  const res = await client.query('SELECT id_payment, id_booking, bukti_transfer, status_payment, metode FROM payments ORDER BY id_payment DESC');
  console.log('Total Payments:', res.rows.length);
  res.rows.forEach(r => {
    const val = r.bukti_transfer || '';
    const proofType = !val ? 'NULL' : val.startsWith('data:') ? 'Base64' : val.startsWith('http') ? 'URL' : `Path: ${val.substring(0, 50)}`;
    console.log(`  ID #${r.id_payment}: status=${r.status_payment}, proofType=${proofType}`);
    console.log(`     Full Value: "${val.substring(0, 100)}..." (len: ${val.length})`);
  });

  console.log('\n🔍 Checking ALL event_payments table rows...');
  const resEvt = await client.query('SELECT id_event_payment, id_event, bukti_transfer, status_payment, metode FROM event_payments ORDER BY id_event_payment DESC');
  console.log('Total Event Payments:', resEvt.rows.length);
  resEvt.rows.forEach(r => {
    const val = r.bukti_transfer || '';
    const proofType = !val ? 'NULL' : val.startsWith('data:') ? 'Base64' : val.startsWith('http') ? 'URL' : `Path: ${val.substring(0, 50)}`;
    console.log(`  ID #${r.id_event_payment}: status=${r.status_payment}, proofType=${proofType}`);
    console.log(`     Full Value: "${val.substring(0, 100)}..." (len: ${val.length})`);
  });

  client.release();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
