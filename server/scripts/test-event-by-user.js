const { Pool } = require('pg');

const poolerUrl = 'postgresql://postgres.kmhqsuzeuekgbpzumkno:smsbugenvil2025@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('🔍 Testing FIXED EventModel.findByUserId query for all user IDs...');
  const resUsers = await client.query('SELECT id_user, nama, email FROM users');
  for (const u of resUsers.rows) {
    try {
      const res = await client.query(`
        SELECT e.id_event, e.id_user, e.nama_event, e.tanggal_event, e.tanggal_selesai,
               e.id_package, e.lokasi_event, e.deskripsi, e.status_event,
               e.catatan_admin, e.catatan_cancel, e.jumlah_hari,
               e.paket_biaya_adjusted, e.tanggal_mulai_paket, e.tanggal_selesai_paket,
               e.created_at,
               ep.nama_paket,
               pay.status_payment AS status_payment, pay.tipe_pembayaran, pay.metode,
               SUM(eo.total_harga) AS total_biaya
        FROM events e
        LEFT JOIN event_packages ep ON e.id_package = ep.id_package
        LEFT JOIN event_payments pay ON e.id_event = pay.id_event
        LEFT JOIN event_orders eo ON e.id_event = eo.id_event
        WHERE e.id_user = $1
        GROUP BY e.id_event, e.id_user, e.nama_event, e.tanggal_event, e.tanggal_selesai,
                 e.id_package, e.lokasi_event, e.deskripsi, e.status_event,
                 e.catatan_admin, e.catatan_cancel, e.jumlah_hari,
                 e.paket_biaya_adjusted, e.tanggal_mulai_paket, e.tanggal_selesai_paket,
                 e.created_at,
                 ep.nama_paket, pay.status_payment, pay.tipe_pembayaran, pay.metode
        ORDER BY e.created_at DESC
      `, [u.id_user]);
      console.log(`  🎉 User #${u.id_user} (${u.nama}): SUCCESS! Returned ${res.rows.length} events:`);
      res.rows.forEach(r => console.log(`      - Event #${r.id_event} "${r.nama_event}": status=${r.status_event}, paket=${r.nama_paket || 'Tanpa Paket'}`));
    } catch (err) {
      console.error(`  ❌ User #${u.id_user} (${u.nama}) ERROR:`, err.message);
    }
  }

  client.release();
  process.exit(0);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
