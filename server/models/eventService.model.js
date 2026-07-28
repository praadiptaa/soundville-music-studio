const db = require('../config/database'); // Database connection

// Event Service Model - Menangani semua database operations untuk event services
class EventServiceModel {
  /**
   * Mengambil semua event services dengan optional filter berdasarkan status
   * @async
   * @param {string|null} [statusFilter] - Filter status (aktif/inactive), null untuk semua
   * @returns {Promise<Array<Object>>} List seluruh data event services
   */
  static async findAll(statusFilter = null) {
    let query = 'SELECT * FROM event_services';
    const params = [];
    if (statusFilter) { // Jika ada filter status
      query += ' WHERE status = ?';
      params.push(statusFilter);
    }
    query += ' ORDER BY id_service ASC'; // Sort by service ID
    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Mengambil detail event service berdasarkan ID
   * @async
   * @param {number} id - ID service
   * @returns {Promise<Object|undefined>} Data service atau undefined jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM event_services WHERE id_service = ?', [id]);
    return rows[0]; // Return service atau undefined
  }

  /**
   * Membuat record event service baru di database
   * @async
   * @param {Object} data - Data service baru
   * @param {string} data.nama_service - Nama service
   * @param {number} data.harga - Harga service (Rp)
   * @param {string} [data.deskripsi] - Deskripsi service
   * @param {string} [data.status] - Status keaktifan service (default: 'aktif')
   * @returns {Promise<number>} ID service yang baru dibuat (insertId)
   */
  static async create({ nama_service, harga, deskripsi, status = 'aktif' }) {
    const [result] = await db.query(
      'INSERT INTO event_services (nama_service, harga, deskripsi, status) VALUES (?, ?, ?, ?)',
      [nama_service, harga, deskripsi, status]
    );
    return result.insertId; // Return ID service yang baru dibuat
  }

  /**
   * Memperbarui data event service yang sudah ada
   * @async
   * @param {number} id - ID service
   * @param {Object} data - Data update service
   * @param {string} [data.nama_service] - Nama service
   * @param {number} [data.harga] - Harga service
   * @param {string} [data.deskripsi] - Deskripsi service
   * @param {string} [data.status] - Status keaktifan service
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async update(id, { nama_service, harga, deskripsi, status }) {
    const [result] = await db.query(
      'UPDATE event_services SET nama_service = ?, harga = ?, deskripsi = ?, status = ? WHERE id_service = ?',
      [nama_service, harga, deskripsi, status, id]
    );
    return result.affectedRows; // Return jumlah baris yang ter-update
  }

  /**
   * Menghapus event service berdasarkan ID
   * @async
   * @param {number} id - ID service
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async delete(id) {
    const [result] = await db.query('DELETE FROM event_services WHERE id_service = ?', [id]);
    return result.affectedRows;
  }
}

module.exports = EventServiceModel; // Export model untuk digunakan di controllers
