const db = require('../config/database'); // Database connection

// Helper function - Format tanggal dari database ke YYYY-MM-DD string
const formatDateString = (dateVal) => {
  if (!dateVal) return null;
  // Jika sudah string YYYY-MM-DD, return as-is
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    return dateVal;
  }
  // Jika Date object atau ISO string, convert to YYYY-MM-DD
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Booking Model - Menangani semua database operations untuk bookings
class BookingModel {
  /**
   * Memeriksa apakah jadwal studio tersedia pada waktu yang diinginkan (tidak bentrok)
   * @async
   * @param {number} id_studio - ID studio yang dipesan
   * @param {string} tanggal - Tanggal booking (format YYYY-MM-DD)
   * @param {string} jam_mulai - Jam mulai booking (format HH:mm)
   * @param {string} jam_selesai - Jam selesai booking (format HH:mm)
   * @param {number} [excludeId] - ID booking yang dikecualikan (opsional, untuk proses update)
   * @returns {Promise<boolean>} True jika jadwal tersedia, False jika bentrok
   */
  static async isScheduleAvailable(id_studio, tanggal, jam_mulai, jam_selesai, excludeId = null) {
    let query = `
      SELECT COUNT(*) AS total
      FROM bookings b
      LEFT JOIN payments p ON b.id_booking = p.id_booking
      WHERE b.id_studio = ?
        AND DATE(b.tanggal) = ?
        AND b.status_booking NOT IN ('rejected', 'cancelled')
        AND (p.status_payment IS NULL OR p.status_payment != 'rejected')
        AND (
          (b.jam_mulai < ? AND b.jam_selesai > ?)
        )
    `;
    const params = [id_studio, tanggal, jam_selesai, jam_mulai];

    if (excludeId) {
      query += ' AND b.id_booking != ?';
      params.push(excludeId);
    }

    const [rows] = await db.query(query, params);
    console.log(`[DEBUG] isScheduleAvailable - Studio: ${id_studio}, Tanggal: ${tanggal}, Available: ${rows[0].total === 0}`);
    return rows[0].total === 0;
  }

  /**
   * Mengambil jadwal booking pada tanggal dan studio tertentu
   * @async
   * @param {number} id_studio - ID studio
   * @param {string} tanggal - Tanggal booking (format YYYY-MM-DD)
   * @returns {Promise<Array<Object>>} List booking pada tanggal tersebut
   */
  static async getScheduleByStudioAndDate(id_studio, tanggal) {
    console.log(`[DEBUG] getScheduleByStudioAndDate - Query: id_studio=${id_studio}, tanggal="${tanggal}"`);
    const [rows] = await db.query(
      `SELECT b.id_booking, b.jam_mulai, b.jam_selesai, b.status_booking, b.tanggal,
              DATE_FORMAT(b.tanggal, '%Y-%m-%d') AS tanggal_formatted,
              u.nama AS nama_customer
       FROM bookings b
       JOIN users u ON b.id_user = u.id_user
       LEFT JOIN payments p ON b.id_booking = p.id_booking
       WHERE b.id_studio = ? 
         AND (DATE(b.tanggal) = ? OR DATE_FORMAT(b.tanggal, '%Y-%m-%d') = ?)
         AND b.status_booking NOT IN ('rejected','cancelled')
         AND (p.status_payment IS NULL OR p.status_payment != 'rejected')
       ORDER BY b.jam_mulai ASC`,
      [id_studio, tanggal, tanggal]
    );
    console.log(`[DEBUG] Query result: Found ${rows.length} booking(s) for ${tanggal}`);
    rows.forEach(r => {
      console.log(`  - Raw: ${r.tanggal}, Formatted: ${r.tanggal_formatted}, Jam: ${r.jam_mulai}~${r.jam_selesai}, User: ${r.nama_customer}, Status: ${r.status_booking}`);
      // Return formatted date
      r.tanggal = r.tanggal_formatted;
    });
    return rows;
  }

  /**
   * Jadwal booking dalam rentang bulan (untuk kalender bulanan)
   * @async
   * @param {number} id_studio - ID studio
   * @param {number} year - Tahun (format YYYY)
   * @param {number} month - Bulan (1-12)
   * @returns {Promise<Array<Object>>} List booking pada bulan tersebut
   */
  static async getScheduleByStudioAndMonth(id_studio, year, month) {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(b.tanggal, '%Y-%m-%d') as tanggal, b.jam_mulai, b.jam_selesai, b.status_booking
       FROM bookings b
       LEFT JOIN payments p ON b.id_booking = p.id_booking
       WHERE b.id_studio = ?
         AND YEAR(b.tanggal) = ?
         AND MONTH(b.tanggal) = ?
         AND b.status_booking NOT IN ('rejected','cancelled')
         AND (p.status_payment IS NULL OR p.status_payment != 'rejected')
       ORDER BY b.tanggal, b.jam_mulai ASC`,
      [id_studio, year, month]
    );
    console.log(`[DEBUG] getScheduleByStudioAndMonth - Studio: ${id_studio}, Year: ${year}, Month: ${month}, Hasil: ${rows.length} booking`);
    return rows;
  }

  /**
   * Mengambil semua data booking beserta detail customer, studio, dan status pembayaran
   * @async
   * @returns {Promise<Array<Object>>} List seluruh data booking
   */
  static async findAll() {
    const [rows] = await db.query(
      `SELECT b.*, DATE_FORMAT(b.tanggal, '%Y-%m-%d') AS tanggal_str, u.nama AS nama_customer, u.email, u.no_hp,
              s.nama_studio, s.harga_per_jam,
              p.status_payment, p.bukti_transfer, p.metode, p.tipe_pembayaran
       FROM bookings b
       JOIN users u   ON b.id_user   = u.id_user
       JOIN studios s ON b.id_studio = s.id_studio
       LEFT JOIN payments p ON b.id_booking = p.id_booking
       ORDER BY b.created_at DESC`
    );
    // Replace tanggal dengan tanggal_str untuk menghindari timezone issue
    rows.forEach(r => {
      if (r.tanggal_str) r.tanggal = r.tanggal_str;
    });
    return rows;
  }

  /**
   * Mengambil detail data booking berdasarkan ID booking
   * @async
   * @param {number} id - ID booking
   * @returns {Promise<Object|null>} Detail booking atau null jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT b.*, DATE_FORMAT(b.tanggal, '%Y-%m-%d') AS tanggal_str, u.nama AS nama_customer, u.email, u.no_hp,
              s.nama_studio, s.harga_per_jam,
              p.id_payment, p.metode, p.bukti_transfer, p.status_payment, p.catatan_admin, p.tipe_pembayaran
       FROM bookings b
       JOIN users u   ON b.id_user   = u.id_user
       JOIN studios s ON b.id_studio = s.id_studio
       LEFT JOIN payments p ON b.id_booking = p.id_booking
       WHERE b.id_booking = ?`,
      [id]
    );
    if (rows[0]) {
      // Gunakan tanggal_str untuk menghindari timezone issue
      rows[0].tanggal = rows[0].tanggal_str;
    }
    return rows[0];
  }

  /**
   * Mengambil semua data booking milik user/customer tertentu
   * @async
   * @param {number} id_user - ID user/customer
   * @returns {Promise<Array<Object>>} List booking milik user tersebut
   */
  static async findByUserId(id_user) {
    const [rows] = await db.query(
      `SELECT b.*, DATE_FORMAT(b.tanggal, '%Y-%m-%d') AS tanggal_str, s.nama_studio, s.harga_per_jam,
              p.status_payment, p.bukti_transfer, p.metode, p.tipe_pembayaran, p.catatan_admin as catatan_payment
       FROM bookings b
       JOIN studios s ON b.id_studio = s.id_studio
       LEFT JOIN payments p ON b.id_booking = p.id_booking
       WHERE b.id_user = ?
       ORDER BY b.created_at DESC`,
      [id_user]
    );
    // Replace tanggal dengan tanggal_str untuk menghindari timezone issue
    rows.forEach(r => {
      if (r.tanggal_str) r.tanggal = r.tanggal_str;
    });
    return rows;
  }

  /**
   * Membuat record booking studio baru di database
   * @async
   * @param {Object} data - Data booking baru
   * @param {number} data.id_user - ID user yang booking
   * @param {number} data.id_studio - ID studio
   * @param {string} data.tanggal - Tanggal booking (format YYYY-MM-DD)
   * @param {string} data.jam_mulai - Jam mulai booking (format HH:mm)
   * @param {string} data.jam_selesai - Jam selesai booking (format HH:mm)
   * @param {number} data.total_harga - Total harga booking
   * @param {string} [data.catatan] - Catatan tambahan
   * @returns {Promise<number>} ID booking yang baru dibuat (insertId)
   */
  static async create({ id_user, id_studio, tanggal, jam_mulai, jam_selesai, total_harga, catatan }) {
    console.log(`[DEBUG] BookingModel.create - Attempting INSERT: id_user=${id_user}, id_studio=${id_studio}, tanggal="${tanggal}", jam=${jam_mulai}-${jam_selesai}, harga=${total_harga}`);
    const [result] = await db.query(
      `INSERT INTO bookings (id_user, id_studio, tanggal, jam_mulai, jam_selesai, total_harga, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_user, id_studio, tanggal, jam_mulai, jam_selesai, total_harga, catatan]
    );
    console.log(`[DEBUG] BookingModel.create - INSERT successful, ID: ${result.insertId}`);
    return result.insertId;
  }

  /**
   * Memperbarui status persetujuan booking (admin)
   * @async
   * @param {number} id - ID booking
   * @param {string} status_booking - Status baru (pending/confirmed/rejected/cancelled)
   * @param {string} [catatan_admin] - Catatan/alasan dari admin (wajib jika rejected)
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async updateStatus(id, status_booking, catatan_admin = null) {
    const [result] = await db.query(
      'UPDATE bookings SET status_booking = ?, catatan_admin = ? WHERE id_booking = ?',
      [status_booking, catatan_admin, id]
    );
    return result.affectedRows;
  }

  /**
   * Membatalkan booking studio oleh customer
   * @async
   * @param {number} id - ID booking
   * @param {string} catatan_cancel - Alasan pembatalan oleh customer
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async cancelBooking(id, catatan_cancel) {
    const [result] = await db.query(
      'UPDATE bookings SET status_booking = ?, catatan_cancel = ? WHERE id_booking = ?',
      ['cancelled', catatan_cancel, id]
    );
    return result.affectedRows;
  }

  /**
   * Menyimpan path file bukti/gambar pendukung pada data booking
   * @async
   * @param {number} id - ID booking
   * @param {string} filename - Path/nama file gambar
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async uploadGambar(id, filename) {
    const [result] = await db.query(
      'UPDATE bookings SET gambar = ? WHERE id_booking = ?',
      [filename, id]
    );
    return result.affectedRows;
  }
}

module.exports = BookingModel;
