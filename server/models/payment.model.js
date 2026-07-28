const db = require('../config/database'); // Database connection

// Payment Model - Menangani semua database operations untuk studio payments
class PaymentModel {
  /**
   * Mengambil semua payments beserta detail booking, customer, dan studio
   * @async
   * @returns {Promise<Array<Object>>} List seluruh data payments
   */
  static async findAll() {
    const [rows] = await db.query(
      `SELECT p.*, b.tanggal, b.jam_mulai, b.jam_selesai, b.total_harga,
              u.nama AS nama_customer, u.email,
              s.nama_studio
       FROM payments p
       JOIN bookings b ON p.id_booking = b.id_booking
       JOIN users u    ON b.id_user    = u.id_user
       JOIN studios s  ON b.id_studio  = s.id_studio
       ORDER BY p.tanggal_payment DESC`
    );
    return rows;
  }

  /**
   * Mengambil detail payment berdasarkan ID, termasuk info booking, customer, dan studio
   * @async
   * @param {number} id - ID payment
   * @returns {Promise<Object|undefined>} Detail payment atau undefined jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, b.tanggal, b.jam_mulai, b.jam_selesai, b.total_harga, b.status_booking,
              u.nama AS nama_customer, u.email, u.no_hp,
              s.nama_studio
       FROM payments p
       JOIN bookings b ON p.id_booking = b.id_booking
       JOIN users u    ON b.id_user    = u.id_user
       JOIN studios s  ON b.id_studio  = s.id_studio
       WHERE p.id_payment = ?`,
      [id]
    );
    return rows[0]; // Return payment detail atau undefined
  }

  /**
   * Mengambil payment berdasarkan booking ID (cek apakah booking sudah memiliki payment)
   * @async
   * @param {number} id_booking - ID booking
   * @returns {Promise<Object|undefined>} Payment record pertama untuk booking ini atau undefined
   */
  static async findByBookingId(id_booking) {
    const [rows] = await db.query(
      'SELECT * FROM payments WHERE id_booking = ?',
      [id_booking]
    );
    return rows[0]; // Return first payment record untuk booking ini
  }

  /**
   * Membuat record payment baru di database
   * @async
   * @param {Object} data - Data payment baru
   * @param {number} data.id_booking - ID booking yang dibayar
   * @param {string|null} data.metode - Metode pembayaran (null saat upload, di-set saat verifikasi)
   * @param {string} data.bukti_transfer - Path file bukti transfer
   * @returns {Promise<number>} ID payment yang baru dibuat (insertId)
   */
  static async create({ id_booking, metode, bukti_transfer, tipe_pembayaran }) {
    const [result] = await db.query(
      'INSERT INTO payments (id_booking, metode, bukti_transfer, tipe_pembayaran) VALUES (?, ?, ?, ?)',
      [id_booking, metode, bukti_transfer, tipe_pembayaran || 'dp']
    );
    return result.insertId; // Return ID payment yang baru dibuat
  }

  static async verify(id, { status_payment, catatan_admin, metode }) {
    let query = 'UPDATE payments SET status_payment = ?, catatan_admin = ?';
    const params = [status_payment, catatan_admin];
    if (metode !== undefined) {
      query += ', metode = ?';
      params.push(metode);
    }
    query += ' WHERE id_payment = ?';
    params.push(id);
    const [result] = await db.query(query, params);
    return result.affectedRows; // Return jumlah baris yang ter-update
  }

  /**
   * Mengupdate bukti transfer pembayaran booking (untuk reupload jika ditolak)
   * @async
   * @param {number} id - ID payment
   * @param {string} bukti_transfer - Path file bukti transfer baru
   * @param {string} [tipe_pembayaran] - Pilihan tipe pembayaran (dp/lunas)
   * @returns {Promise<number>} Jumlah baris yang terpengaruh
   */
  static async updateProof(id, bukti_transfer, tipe_pembayaran) {
    const [result] = await db.query(
      'UPDATE payments SET status_payment = "pending", catatan_admin = NULL, bukti_transfer = ?, tipe_pembayaran = ? WHERE id_payment = ?',
      [bukti_transfer, tipe_pembayaran || 'dp', id]
    );
    return result.affectedRows;
  }
}

module.exports = PaymentModel; // Export model untuk digunakan di controllers
