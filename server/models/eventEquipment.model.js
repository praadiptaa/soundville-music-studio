const db = require('../config/database'); // Database connection

// Event Equipment Model - Menangani semua database operations untuk event equipment
class EventEquipmentModel {
  /**
   * Mengambil semua data equipment yang aktif, diurutkan berdasarkan nama alat
   * @async
   * @returns {Promise<Array<Object>>} List seluruh data equipment aktif
   */
  static async findAll() {
    const [rows] = await db.query(
      'SELECT * FROM event_equipment WHERE status = "aktif" ORDER BY nama_alat' // Filter hanya yang aktif, sort by name
    );
    return rows;
  }

  /**
   * Mengambil data equipment berdasarkan ID
   * @async
   * @param {number} id - ID equipment
   * @returns {Promise<Object|null>} Data equipment atau null jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM event_equipment WHERE id_equipment = ?',
      [id]
    );
    return rows[0] || null; // Return equipment atau null
  }

  /**
   * Membuat record equipment baru di database
   * @async
   * @param {Object} data - Data equipment baru
   * @param {string} data.nama_alat - Nama alat
   * @param {string} data.spesifikasi - Spesifikasi alat
   * @param {number} [data.harga_sewa] - Harga sewa alat (opsional)
   * @param {number} [data.durasi_hari] - Durasi sewa dalam hari (default: 1)
   * @param {string} [data.status] - Status keaktifan alat (default: 'aktif')
   * @returns {Promise<number>} ID equipment yang baru dibuat (insertId)
   */
  static async create({ nama_alat, spesifikasi, harga_sewa = null, durasi_hari = 1, status = 'aktif' }) {
    const [result] = await db.query(
      'INSERT INTO event_equipment (nama_alat, spesifikasi, harga_sewa, durasi_hari, status) VALUES (?, ?, ?, ?, ?)',
      [nama_alat, spesifikasi, harga_sewa, durasi_hari, status]
    );
    return result.insertId; // Return ID equipment yang baru dibuat
  }

  /**
   * Memperbarui data equipment yang sudah ada
   * @async
   * @param {number} id - ID equipment
   * @param {Object} data - Data update equipment
   * @param {string} data.nama_alat - Nama alat
   * @param {string} data.spesifikasi - Spesifikasi alat
   * @param {number} data.harga_sewa - Harga sewa alat
   * @param {number} data.durasi_hari - Durasi sewa dalam hari
   * @param {string} data.status - Status keaktifan alat
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async update(id, { nama_alat, spesifikasi, harga_sewa, durasi_hari, status }) {
    const [result] = await db.query(
      'UPDATE event_equipment SET nama_alat = ?, spesifikasi = ?, harga_sewa = ?, durasi_hari = ?, status = ? WHERE id_equipment = ?',
      [nama_alat, spesifikasi, harga_sewa, durasi_hari, status, id]
    );
    return result.affectedRows; // Return jumlah baris yang ter-update
  }

  /**
   * Menghapus data equipment berdasarkan ID
   * @async
   * @param {number} id - ID equipment
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM event_equipment WHERE id_equipment = ?',
      [id]
    );
    return result.affectedRows;
  }

  // ===== Package Equipment Relationship Management =====
  /**
   * Mengambil list equipment aktif yang tergabung dalam paket event tertentu
   * @async
   * @param {number} id_package - ID paket event
   * @returns {Promise<Array<Object>>} List equipment dalam paket tersebut
   */
  static async getByPackage(id_package) {
    const [rows] = await db.query(
      `SELECT ee.* FROM event_equipment ee
       JOIN event_package_equipment epe ON ee.id_equipment = epe.id_equipment
       WHERE epe.id_package = ? AND ee.status = 'aktif'
       ORDER BY ee.nama_alat`,
      [id_package]
    );
    return rows;
  }

  /**
   * Menambahkan hubungan antara paket event dan equipment (menambahkan equipment ke paket)
   * @async
   * @param {number} id_package - ID paket event
   * @param {number} id_equipment - ID equipment
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async addToPackage(id_package, id_equipment) {
    const [result] = await db.query(
      'INSERT IGNORE INTO event_package_equipment (id_package, id_equipment) VALUES (?, ?)', // IGNORE untuk avoid duplicate
      [id_package, id_equipment]
    );
    return result.affectedRows;
  }

  /**
   * Menghapus hubungan antara paket event dan equipment (mengeluarkan equipment dari paket)
   * @async
   * @param {number} id_package - ID paket event
   * @param {number} id_equipment - ID equipment
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async removeFromPackage(id_package, id_equipment) {
    const [result] = await db.query(
      'DELETE FROM event_package_equipment WHERE id_package = ? AND id_equipment = ?',
      [id_package, id_equipment]
    );
    return result.affectedRows;
  }

  /**
   * Memperbarui path file gambar/foto untuk equipment tertentu
   * @async
   * @param {number} id - ID equipment
   * @param {string} filePath - Path/nama file gambar
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async uploadGambar(id, filePath) {
    const [result] = await db.query(
      'UPDATE event_equipment SET gambar = ? WHERE id_equipment = ?',
      [filePath, id]
    );
    return result.affectedRows;
  }
}

module.exports = EventEquipmentModel; // Export model untuk digunakan di controllers
