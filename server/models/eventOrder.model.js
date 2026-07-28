const db = require('../config/database'); // Database connection

// Event Order Model - Menangani semua database operations untuk event service orders
class EventOrderModel {
  /**
   * Membuat multiple event orders sekaligus (bulk insert) untuk satu event
   * @async
   * @param {number} id_event - ID event
   * @param {Array<Object>} orders - Array of order items
   * @param {number} orders[].id_service - ID service yang dipesan
   * @param {number} orders[].qty - Jumlah/quantity service
   * @param {number} orders[].total_harga - Total harga (harga × qty)
   * @returns {Promise<number>} Jumlah baris yang berhasil di-insert (affectedRows)
   */
  static async createBulk(id_event, orders) {
    // orders: [{ id_service, qty, total_harga }]
    const values = orders.map(o => [id_event, o.id_service, o.qty, o.total_harga]); // Prepare values array
    const [result] = await db.query(
      'INSERT INTO event_orders (id_event, id_service, qty, total_harga) VALUES ?', // Bulk insert
      [values]
    );
    return result.affectedRows; // Return jumlah baris yang di-insert
  }

  /**
   * Mengambil semua service orders untuk event tertentu beserta detail service
   * @async
   * @param {number} id_event - ID event
   * @returns {Promise<Array<Object>>} List order items dengan detail service
   */
  static async findByEventId(id_event) {
    const [rows] = await db.query(
      `SELECT eo.*, es.nama_service, es.harga AS harga_satuan
       FROM event_orders eo
       JOIN event_services es ON eo.id_service = es.id_service
       WHERE eo.id_event = ?`,
      [id_event]
    );
    return rows;
  }

  /**
   * Menghapus semua service orders untuk event tertentu
   * @async
   * @param {number} id_event - ID event
   * @returns {Promise<number>} Jumlah baris yang dihapus (affectedRows)
   */
  static async deleteByEventId(id_event) {
    const [result] = await db.query('DELETE FROM event_orders WHERE id_event = ?', [id_event]);
    return result.affectedRows; // Return jumlah baris yang dihapus
  }
}

module.exports = EventOrderModel; // Export model untuk digunakan di controllers
