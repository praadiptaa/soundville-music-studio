const db = require('../config/database'); // Database connection

// Event Rental Model - Menangani semua database operations untuk event equipment rentals
class EventRentalModel {
  /**
   * Mengambil semua rental equipment untuk event tertentu beserta detail alat
   * @async
   * @param {number} id_event - ID event
   * @returns {Promise<Array<Object>>} List rental items dengan detail equipment
   */
  static async findByEvent(id_event) {
    const [rows] = await db.query(
      `SELECT er.*, ee.nama_alat, ee.spesifikasi
       FROM event_rentals er
       JOIN event_equipment ee ON er.id_equipment = ee.id_equipment
       WHERE er.id_event = ?
       ORDER BY er.created_at DESC`,
      [id_event]
    );
    return rows;
  }

  /**
   * Membuat satu record rental equipment baru dan menghitung total harga otomatis
   * @async
   * @param {number} id_event - ID event
   * @param {number} id_equipment - ID equipment yang disewa
   * @param {number} qty - Jumlah/quantity
   * @param {number} harga_satuan - Harga per unit
   * @returns {Promise<number>} ID rental yang baru dibuat (insertId)
   */
  static async create(id_event, id_equipment, qty, harga_satuan) {
    const total_harga = harga_satuan * qty; // Calculate total price
    const [result] = await db.query(
      'INSERT INTO event_rentals (id_event, id_equipment, qty, harga_satuan, total_harga) VALUES (?, ?, ?, ?, ?)',
      [id_event, id_equipment, qty, harga_satuan, total_harga]
    );
    return result.insertId; // Return ID rental yang baru dibuat
  }

  /**
   * Membuat multiple rental records sekaligus (bulk create) untuk satu event
   * @async
   * @param {number} id_event - ID event
   * @param {Array<Object>} items - Array of rental items
   * @param {number} items[].id_equipment - ID equipment yang disewa
   * @param {number} [items[].qty] - Jumlah/quantity (default: 1)
   * @param {number} items[].harga_satuan - Harga per unit
   * @returns {Promise<void>}
   */
  static async createBulk(id_event, items) {
    // items: [{ id_equipment, qty, harga_satuan }]
    for (const item of items) {
      await this.create(id_event, item.id_equipment, item.qty || 1, item.harga_satuan);
    }
  }

  /**
   * Menghapus semua rental records untuk event tertentu
   * @async
   * @param {number} id_event - ID event
   * @returns {Promise<number>} Jumlah baris yang dihapus (affectedRows)
   */
  static async deleteByEvent(id_event) {
    const [result] = await db.query(
      'DELETE FROM event_rentals WHERE id_event = ?',
      [id_event]
    );
    return result.affectedRows; // Return jumlah baris yang dihapus
  }

  /**
   * Menghitung total harga seluruh rental equipment untuk event tertentu
   * @async
   * @param {number} id_event - ID event
   * @returns {Promise<number>} Total harga rental atau 0 jika tidak ada
   */
  static async getTotalByEvent(id_event) {
    const [rows] = await db.query(
      'SELECT SUM(total_harga) AS total FROM event_rentals WHERE id_event = ?',
      [id_event]
    );
    return rows[0]?.total || 0; // Return total atau 0 jika tidak ada rentals
  }
}

module.exports = EventRentalModel; // Export model untuk digunakan di controllers
