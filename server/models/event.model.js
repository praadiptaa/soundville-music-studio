const db = require('../config/database');
const EventPackageModel = require('./eventPackage.model');

class EventModel {
  /**
   * Mengambil semua data event beserta detail customer, paket event, dan service yang dipilih
   * @async
   * @returns {Promise<Array<Object>>} List seluruh data event
   */
  static async findAll() {
    const [rows] = await db.query(
      `SELECT e.*, u.nama AS nama_customer, u.email,
              ep.nama_paket,
              pay.status_payment AS status_payment, pay.tipe_pembayaran, pay.metode,
              STRING_AGG(es.nama_service, ', ' ORDER BY es.nama_service) AS services
       FROM events e
       JOIN users u ON e.id_user = u.id_user
       LEFT JOIN event_packages ep ON e.id_package = ep.id_package
       LEFT JOIN event_payments pay ON e.id_event = pay.id_event
       LEFT JOIN event_orders eo ON e.id_event = eo.id_event
       LEFT JOIN event_services es ON eo.id_service = es.id_service
       GROUP BY e.id_event, u.nama, u.email, ep.nama_paket, pay.status_payment, pay.tipe_pembayaran, pay.metode
       ORDER BY e.created_at DESC`
    );
    return rows;
  }

  /**
   * Mengambil detail event berdasarkan ID event, termasuk services (orders) dan equipment (rentals)
   * @async
   * @param {number} id - ID event
   * @returns {Promise<Object|null>} Detail event lengkap atau null jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT e.*, u.nama AS nama_customer, u.email, u.no_hp,
              ep.nama_paket, ep.harga AS paket_harga, ep.durasi_hari,
              pay.status_payment AS status_payment, pay.tipe_pembayaran, pay.metode
       FROM events e
       JOIN users u ON e.id_user = u.id_user
       LEFT JOIN event_packages ep ON e.id_package = ep.id_package
       LEFT JOIN event_payments pay ON e.id_event = pay.id_event
       WHERE e.id_event = ?`,
      [id]
    );
    if (!rows[0]) return null;

    // Ambil order detail (services)
    const [orders] = await db.query(
      `SELECT eo.*, es.nama_service, es.harga AS harga_satuan
       FROM event_orders eo
       JOIN event_services es ON eo.id_service = es.id_service
       WHERE eo.id_event = ?`,
      [id]
    );

    // Ambil rental detail (equipment)
    const [rentals] = await db.query(
      `SELECT er.*, ee.nama_alat, ee.spesifikasi
       FROM event_rentals er
       JOIN event_equipment ee ON er.id_equipment = ee.id_equipment
       WHERE er.id_event = ?
       ORDER BY er.created_at DESC`,
      [id]
    );

    return { ...rows[0], orders, rentals };
  }

  /**
   * Mengambil list data event milik user/customer tertentu
   * @async
   * @param {number} id_user - ID user/customer
   * @returns {Promise<Array<Object>>} List event milik customer tersebut
   */
  static async findByUserId(id_user) {
    const [rows] = await db.query(
      `SELECT e.id_event, e.id_user, e.nama_event, e.tanggal_event, e.tanggal_selesai,
              e.id_package, e.lokasi_event, e.deskripsi, e.status_event,
              e.catatan_admin, e.catatan_cancel, e.jumlah_hari,
              e.paket_biaya_adjusted, e.tanggal_mulai_paket, e.tanggal_selesai_paket,
              e.created_at, e.updated_at,
              ep.nama_paket,
              pay.status_payment AS status_payment, pay.tipe_pembayaran, pay.metode,
              SUM(eo.total_harga) AS total_biaya
       FROM events e
       LEFT JOIN event_packages ep ON e.id_package = ep.id_package
       LEFT JOIN event_payments pay ON e.id_event = pay.id_event
       LEFT JOIN event_orders eo ON e.id_event = eo.id_event
       WHERE e.id_user = ?
       GROUP BY e.id_event, e.id_user, e.nama_event, e.tanggal_event, e.tanggal_selesai,
                e.id_package, e.lokasi_event, e.deskripsi, e.status_event,
                e.catatan_admin, e.catatan_cancel, e.jumlah_hari,
                e.paket_biaya_adjusted, e.tanggal_mulai_paket, e.tanggal_selesai_paket,
                e.created_at, e.updated_at,
                ep.nama_paket, pay.status_payment, pay.tipe_pembayaran, pay.metode
       ORDER BY e.created_at DESC`,
      [id_user]
    );
    return rows;
  }

  /**
   * Membuat record event baru di database dan menghitung jumlah hari serta biaya paket yang disesuaikan
   * @async
   * @param {Object} data - Data event baru
   * @param {number} data.id_user - ID user/customer
   * @param {string} data.nama_event - Nama event
   * @param {string} data.tanggal_event - Tanggal mulai event (format YYYY-MM-DD)
   * @param {string} [data.tanggal_selesai] - Tanggal selesai event (format YYYY-MM-DD)
   * @param {number} [data.id_package] - ID paket event
   * @param {string} [data.tanggal_mulai_paket] - Tanggal mulai pemakaian paket
   * @param {string} [data.tanggal_selesai_paket] - Tanggal selesai pemakaian paket
   * @param {string} [data.lokasi_event] - Lokasi/venue event
   * @param {string} [data.deskripsi] - Deskripsi detail event
   * @returns {Promise<number>} ID event yang baru dibuat (insertId)
   */
  static async create({ id_user, nama_event, tanggal_event, tanggal_selesai, id_package = null, tanggal_mulai_paket = null, tanggal_selesai_paket = null, lokasi_event, deskripsi }) {
    // Calculate jumlah_hari from date range
    let jumlah_hari = 1;
    if (tanggal_selesai && tanggal_event) {
      const start = new Date(tanggal_event);
      const end = new Date(tanggal_selesai);
      const diffTime = Math.abs(end - start);
      jumlah_hari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 untuk include hari pertama
    }

    // Calculate paket_biaya_adjusted if package dates are provided
    let paket_biaya_adjusted = null;
    if (id_package && (tanggal_mulai_paket || tanggal_selesai_paket)) {
      try {
        const pkg = await EventPackageModel.findById(id_package);
        if (pkg) {
          // Calculate package days
          const pkgStart = new Date(tanggal_mulai_paket || tanggal_event);
          const pkgEnd = new Date(tanggal_selesai_paket || tanggal_mulai_paket || tanggal_event);
          const pkgDiffTime = Math.abs(pkgEnd - pkgStart);
          const paket_hari = Math.ceil(pkgDiffTime / (1000 * 60 * 60 * 24)) + 1; // +1 untuk include hari pertama

          // Calculate adjusted price: harga * paket_hari (harga per hari)
          paket_biaya_adjusted = pkg.harga * paket_hari;
        }
      } catch (err) {
        console.log('Warning: Could not calculate adjusted price:', err.message);
      }
    }

    const [result] = await db.query(
      'INSERT INTO events (id_user, nama_event, tanggal_event, tanggal_selesai, id_package, paket_biaya_adjusted, tanggal_mulai_paket, tanggal_selesai_paket, jumlah_hari, lokasi_event, deskripsi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id_user, nama_event, tanggal_event, tanggal_selesai, id_package, paket_biaya_adjusted, tanggal_mulai_paket, tanggal_selesai_paket, jumlah_hari, lokasi_event, deskripsi]
    );
    return result.insertId;
  }

  /**
   * Memperbarui status persetujuan event (admin)
   * @async
   * @param {number} id - ID event
   * @param {string} status_event - Status baru (pending/approved/rejected/completed)
   * @param {string} [catatan_admin] - Catatan/alasan dari admin (wajib jika rejected)
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async updateStatus(id, status_event, catatan_admin = null) {
    const [result] = await db.query(
      'UPDATE events SET status_event = ?, catatan_admin = ? WHERE id_event = ?',
      [status_event, catatan_admin, id]
    );
    return result.affectedRows;
  }

  /**
   * Membatalkan event oleh customer
   * @async
   * @param {number} id - ID event
   * @param {string} catatan_cancel - Alasan pembatalan oleh customer
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async cancelEvent(id, catatan_cancel) {
    const [result] = await db.query(
      'UPDATE events SET status_event = ?, catatan_cancel = ? WHERE id_event = ?',
      ['cancelled', catatan_cancel, id]
    );
    return result.affectedRows;
  }
}

module.exports = EventModel;
