const db = require('../config/database'); // Database connection
const bcrypt = require('bcryptjs'); // Library untuk hashing password

// User Model - Menangani semua database operations untuk users
class UserModel {
  /**
   * Mengambil semua data user dari database (tanpa password)
   * @async
   * @returns {Promise<Array<Object>>} List seluruh data user
   */
  static async findAll() {
    const [rows] = await db.query(
      'SELECT id_user, nama, email, no_hp, role, created_at FROM users ORDER BY created_at DESC' // Get all users, exclude password
    );
    return rows;
  }

  /**
   * Mengambil detail user berdasarkan ID (tanpa password)
   * @async
   * @param {number} id - ID user
   * @returns {Promise<Object|undefined>} Data user atau undefined jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id_user, nama, email, no_hp, role, created_at FROM users WHERE id_user = ?',
      [id]
    );
    return rows[0]; // Return user atau undefined
  }

  /**
   * Mengambil data user berdasarkan email (termasuk password untuk proses login)
   * @async
   * @param {string} email - Email address user
   * @returns {Promise<Object|undefined>} Data user lengkap (termasuk password) atau undefined
   */
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]); // Include password untuk login
    return rows[0];
  }

  /**
   * Membuat record user baru di database dengan password yang di-hash
   * @async
   * @param {Object} data - Data user baru
   * @param {string} data.nama - Nama lengkap user
   * @param {string} data.email - Email user (unique)
   * @param {string} data.password - Password user (plain text, akan di-hash)
   * @param {string} [data.no_hp] - Nomor telepon user
   * @param {string} [data.role] - Role user (default: 'customer')
   * @returns {Promise<number>} ID user yang baru dibuat (insertId)
   */
  static async create({ nama, email, password, no_hp, role = 'customer' }) {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password sebelum disimpan
    const [result] = await db.query(
      'INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)',
      [nama, email, hashedPassword, no_hp, role]
    );
    return result.insertId; // Return ID user yang baru dibuat
  }

  /**
   * Memperbarui data profil user (nama, email, nomor HP)
   * @async
   * @param {number} id - ID user
   * @param {Object} data - Data update profil
   * @param {string} data.nama - Nama lengkap user
   * @param {string} data.email - Email user
   * @param {string} data.no_hp - Nomor telepon user
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async update(id, { nama, email, no_hp, role }) {
    if (role) {
      const [result] = await db.query(
        'UPDATE users SET nama = ?, email = ?, no_hp = ?, role = ? WHERE id_user = ?',
        [nama, email, no_hp, role, id]
      );
      return result.affectedRows;
    }
    const [result] = await db.query(
      'UPDATE users SET nama = ?, email = ?, no_hp = ? WHERE id_user = ?',
      [nama, email, no_hp, id]
    );
    return result.affectedRows;
  }

  /**
   * Memperbarui password user dengan password baru yang di-hash
   * @async
   * @param {number} id - ID user
   * @param {string} newPassword - Password baru (plain text, akan di-hash)
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async updatePassword(id, newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10); // Hash password baru
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE id_user = ?',
      [hashed, id]
    );
    return result.affectedRows;
  }

  /**
   * Memperbarui role user (admin / operator / customer)
   */
  static async updateRole(id, role) {
    const [result] = await db.query(
      'UPDATE users SET role = ? WHERE id_user = ?',
      [role, id]
    );
    return result.affectedRows;
  }

  /**
   * Menghapus data user dari database berdasarkan ID
   * @async
   * @param {number} id - ID user
   * @returns {Promise<number>} Jumlah baris yang terpengaruh (affectedRows)
   */
  static async delete(id) {
    const [result] = await db.query('DELETE FROM users WHERE id_user = ?', [id]);
    return result.affectedRows;
  }

  /**
   * Membandingkan password plain text dengan password yang sudah di-hash
   * @async
   * @param {string} plainPassword - Password plain text dari input user
   * @param {string} hashedPassword - Password yang sudah di-hash dari database
   * @returns {Promise<boolean>} True jika password cocok, False jika tidak
   */
  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword); // Return true/false
  }
}

module.exports = UserModel; // Export model untuk digunakan di controllers
