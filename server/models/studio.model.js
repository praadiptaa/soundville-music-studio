const db = require('../config/database'); // Database connection

// Studio Model - Menangani semua database operations untuk studios
class StudioModel {
  /**
   * Mengambil semua studio dengan optional filter berdasarkan status
   * @async
   * @param {string|null} [statusFilter] - Filter status (aktif/nonaktif), null untuk semua
   * @returns {Promise<Array<Object>>} List seluruh data studio
   */
  static async findAll(statusFilter = null) {
    let query = 'SELECT * FROM studios'; // Base query
    const params = [];
    if (statusFilter) { // Jika ada filter status
      query += ' WHERE status = ?';
      params.push(statusFilter);
    }
    query += ' ORDER BY id_studio ASC'; // Sort by studio ID
    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Mengambil detail studio berdasarkan ID
   * @async
   * @param {number} id - ID studio
   * @returns {Promise<Object|undefined>} Data studio atau undefined jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM studios WHERE id_studio = ?', [id]);
    return rows[0]; // Return studio atau undefined
  }

  /**
   * Membuat record studio baru di database
   * @async
   * @param {Object} data - Data studio baru
   * @param {string} data.nama_studio - Nama studio
   * @param {number} data.harga_per_jam - Harga sewa per jam (Rp)
   * @param {string} [data.deskripsi] - Deskripsi studio
   * @param {string} [data.fasilitas] - Fasilitas yang tersedia
   * @param {string} [data.foto] - Path foto studio
   * @param {string} [data.status] - Status studio (default: 'aktif')
   * @returns {Promise<number>} ID studio yang baru dibuat (insertId)
   */
  static async create({ nama_studio, harga_per_jam, deskripsi, fasilitas, foto, status = 'aktif' }) {
    const [result] = await db.query(
      'INSERT INTO studios (nama_studio, harga_per_jam, deskripsi, fasilitas, foto, status) VALUES (?, ?, ?, ?, ?, ?)',
      [nama_studio, harga_per_jam, deskripsi, fasilitas, foto, status]
    );
    return result.insertId; // Return ID studio yang baru dibuat
  }

  /**
   * Memperbarui data studio yang sudah ada
   * @async
   * @param {number} id - ID studio
   * @param {Object} data - Data update studio
   * @param {string} data.nama_studio - Nama studio
   * @param {number} data.harga_per_jam - Harga sewa per jam (Rp)
   * @param {string} data.deskripsi - Deskripsi studio
   * @param {string} data.fasilitas - Fasilitas yang tersedia
   * @param {string} data.foto - Path foto studio
   * @param {string} data.status - Status studio
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async update(id, { nama_studio, harga_per_jam, deskripsi, fasilitas, foto, status }) {
    const [result] = await db.query(
      'UPDATE studios SET nama_studio = ?, harga_per_jam = ?, deskripsi = ?, fasilitas = ?, foto = ?, status = ? WHERE id_studio = ?',
      [nama_studio, harga_per_jam, deskripsi, fasilitas, foto, status, id]
    );
    return result.affectedRows; // Return jumlah baris yang ter-update
  }

  /**
   * Menghapus studio berdasarkan ID
   * @async
   * @param {number} id - ID studio
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async delete(id) {
    const [result] = await db.query('DELETE FROM studios WHERE id_studio = ?', [id]);
    return result.affectedRows;
  }

  /**
   * Memperbarui path file foto/gambar untuk studio
   * @async
   * @param {number} id - ID studio
   * @param {string} filePath - Path/nama file gambar
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async uploadGambar(id, filePath) {
    const [result] = await db.query(
      'UPDATE studios SET foto = ? WHERE id_studio = ?', // Update field foto dengan path file
      [filePath, id]
    );
    return result.affectedRows;
  }
}

module.exports = StudioModel; // Export model untuk digunakan di controllers
