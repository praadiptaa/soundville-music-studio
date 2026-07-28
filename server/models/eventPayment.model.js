const db = require('../config/database'); // Database connection

// Event Payment Model - Menangani semua database operations untuk event payments
class EventPaymentModel {
  /**
   * Mengambil semua event payments beserta detail event, customer, paket, dan total harga
   * @async
   * @returns {Promise<Array<Object>>} List seluruh data event payments
   */
  static async findAll() {
    const [rows] = await db.query(
      `SELECT ep.*, e.nama_event, e.tanggal_event, e.status_event,
              u.nama AS nama_customer, u.email,
              COALESCE(p.nama_paket, '-') AS nama_paket,
              (
                COALESCE(e.paket_biaya_adjusted, p.harga, 0) +
                COALESCE((SELECT SUM(total_harga) FROM event_orders WHERE id_event = e.id_event), 0) +
                COALESCE((SELECT SUM(total_harga) FROM event_rentals WHERE id_event = e.id_event), 0)
              ) AS total_harga
       FROM event_payments ep
       JOIN events e ON ep.id_event = e.id_event
       JOIN users u ON e.id_user = u.id_user
       LEFT JOIN event_packages p ON e.id_package = p.id_package
       ORDER BY ep.tanggal_payment DESC`
    );
    return rows;
  }

  /**
   * Mengambil detail event payment berdasarkan ID, termasuk info event, customer, dan total harga
   * @async
   * @param {number} id - ID event payment
   * @returns {Promise<Object|undefined>} Detail event payment atau undefined jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT ep.*, e.nama_event, e.tanggal_event, e.status_event,
              u.nama AS nama_customer, u.email, u.no_hp,
              COALESCE(p.nama_paket, '-') AS nama_paket,
              (
                COALESCE(e.paket_biaya_adjusted, p.harga, 0) +
                COALESCE((SELECT SUM(total_harga) FROM event_orders WHERE id_event = e.id_event), 0) +
                COALESCE((SELECT SUM(total_harga) FROM event_rentals WHERE id_event = e.id_event), 0)
              ) AS total_harga
       FROM event_payments ep
       JOIN events e ON ep.id_event = e.id_event
       JOIN users u ON e.id_user = u.id_user
       LEFT JOIN event_packages p ON e.id_package = p.id_package
       WHERE ep.id_event_payment = ?`,
      [id]
    );
    return rows[0]; // Return payment detail atau undefined
  }

  /**
   * Mengambil event payment berdasarkan event ID (cek apakah event sudah memiliki payment)
   * @async
   * @param {number} id_event - ID event
   * @returns {Promise<Object|undefined>} Payment record pertama untuk event ini atau undefined
   */
  static async findByEventId(id_event) {
    const [rows] = await db.query(
      `SELECT ep.*, e.nama_event, e.tanggal_event,
              u.nama AS nama_customer, u.email
       FROM event_payments ep
       JOIN events e ON ep.id_event = e.id_event
       JOIN users u ON e.id_user = u.id_user
       WHERE ep.id_event = ?`,
      [id_event]
    );
    return rows[0]; // Return first payment record untuk event ini
  }

  /**
   * Membuat record event payment baru di database
   * @async
   * @param {Object} data - Data payment baru
   * @param {number} data.id_event - ID event yang dibayar
   * @param {string|null} data.metode - Metode pembayaran (null saat upload, di-set saat verifikasi)
   * @param {string} data.bukti_transfer - Path file bukti transfer
   * @returns {Promise<number>} ID event payment yang baru dibuat (insertId)
   */
  static async create({ id_event, metode, jumlah_bayar, tipe_pembayaran, bukti_transfer }) {
    const [result] = await db.query(
      'INSERT INTO event_payments (id_event, metode, jumlah_bayar, tipe_pembayaran, bukti_transfer) VALUES (?, ?, ?, ?, ?)',
      [id_event, metode, jumlah_bayar || null, tipe_pembayaran || 'dp', bukti_transfer]
    );
    return result.insertId; // Return ID payment yang baru dibuat
  }

  /**
   * Memverifikasi atau menolak event payment (admin)
   * @async
   * @param {number} id - ID event payment
   * @param {Object} data - Data verifikasi
   * @param {string} data.status_payment - Status baru (verified/rejected)
   * @param {string|null} data.catatan_admin - Catatan dari admin (wajib jika rejected)
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async verify(id, { status_payment, catatan_admin, metode }) {
    let query = 'UPDATE event_payments SET status_payment = ?, catatan_admin = ?';
    const params = [status_payment, catatan_admin];
    if (metode !== undefined) {
      query += ', metode = ?';
      params.push(metode);
    }
    query += ' WHERE id_event_payment = ?';
    params.push(id);
    const [result] = await db.query(query, params);
    return result.affectedRows; // Return jumlah baris yang ter-update
  }

  /**
   * Mengupdate bukti transfer pembayaran event (untuk reupload jika ditolak)
   * @async
   * @param {number} id - ID event payment
   * @param {string} bukti_transfer - Path file bukti transfer baru
   * @param {number|null} jumlah_bayar - Nominal yang dibayar (bisa berubah jika harga disesuaikan)
   * @param {string} [tipe_pembayaran] - Tipe pembayaran (dp/full_payment)
   * @returns {Promise<number>} Jumlah baris yang terpengaruh
   */
  static async updateProof(id, bukti_transfer, jumlah_bayar, tipe_pembayaran) {
    const [result] = await db.query(
      'UPDATE event_payments SET status_payment = "pending", catatan_admin = NULL, bukti_transfer = ?, jumlah_bayar = ?, tipe_pembayaran = ? WHERE id_event_payment = ?',
      [bukti_transfer, jumlah_bayar || null, tipe_pembayaran || 'dp', id]
    );
    return result.affectedRows;
  }
}

module.exports = EventPaymentModel; // Export model untuk digunakan di controllers