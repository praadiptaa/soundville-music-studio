const db = require('../config/database') // Database connection

// Event Package Model - Menangani semua database operations untuk event packages
class EventPackageModel {
  /**
   * Mengambil semua event packages, diurutkan berdasarkan harga (termurah dulu)
   * @async
   * @returns {Promise<Array<Object>>} List seluruh data event packages
   */
  static async findAll() {
    const [rows] = await db.query(
      'SELECT * FROM event_packages ORDER BY harga ASC' // Sort by price ascending
    )
    return rows
  }

  /**
   * Mengambil detail event package berdasarkan ID
   * @async
   * @param {number} id - ID package
   * @returns {Promise<Object|undefined>} Data package atau undefined jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM event_packages WHERE id_package = ?',
      [id]
    )
    return rows[0] // Return package detail atau undefined
  }

  /**
   * Membuat record event package baru di database
   * @async
   * @param {Object} data - Data package baru
   * @param {string} data.nama_paket - Nama paket
   * @param {number} data.harga - Harga paket (Rp)
   * @param {string} [data.deskripsi] - Deskripsi paket
   * @param {string} [data.fasilitas] - Daftar fasilitas yang termasuk
   * @param {number} [data.durasi_hari] - Durasi event dalam hari (default: 1)
   * @param {string} [data.status] - Status keaktifan paket (default: 'aktif')
   * @returns {Promise<number>} ID package yang baru dibuat (insertId)
   */
  static async create({ nama_paket, harga, deskripsi, fasilitas, durasi_hari, status }) {
    const [result] = await db.query(
      'INSERT INTO event_packages (nama_paket, harga, deskripsi, fasilitas, durasi_hari, status) VALUES (?, ?, ?, ?, ?, ?)',
      [nama_paket, harga, deskripsi || null, fasilitas || null, durasi_hari || 1, status || 'aktif']
    )
    return result.insertId // Return ID package yang baru dibuat
  }

  /**
   * Memperbarui data event package yang sudah ada
   * @async
   * @param {number} id - ID package
   * @param {Object} data - Data update package
   * @param {string} data.nama_paket - Nama paket
   * @param {number} data.harga - Harga paket (Rp)
   * @param {string} [data.deskripsi] - Deskripsi paket
   * @param {string} [data.fasilitas] - Daftar fasilitas
   * @param {number} [data.durasi_hari] - Durasi event dalam hari
   * @param {string} [data.status] - Status keaktifan paket
   * @returns {Promise<boolean>} True jika ada baris yang ter-update
   */
  static async update(id, { nama_paket, harga, deskripsi, fasilitas, durasi_hari, status }) {
    const [result] = await db.query(
      'UPDATE event_packages SET nama_paket=?, harga=?, deskripsi=?, fasilitas=?, durasi_hari=?, status=? WHERE id_package=?',
      [nama_paket, harga, deskripsi || null, fasilitas || null, durasi_hari || 1, status || 'aktif', id]
    )
    return result.affectedRows > 0 // Return true jika ada baris yang ter-update
  }

  /**
   * Menghapus event package berdasarkan ID
   * @async
   * @param {number} id - ID package
   * @returns {Promise<boolean>} True jika ada baris yang dihapus
   */
  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM event_packages WHERE id_package = ?',
      [id]
    )
    return result.affectedRows > 0 // Return true jika ada baris yang dihapus
  }

  /**
   * Memperbarui path file gambar/foto untuk event package
   * @async
   * @param {number} id - ID package
   * @param {string} filePath - Path/nama file gambar
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async uploadGambar(id, filePath) {
    const [result] = await db.query(
      'UPDATE event_packages SET gambar = ? WHERE id_package = ?',
      [filePath, id]
    )
    return result.affectedRows // Return jumlah baris yang ter-update
  }
}

module.exports = EventPackageModel // Export model untuk digunakan di controllers
