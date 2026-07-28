const db = require('../config/database');

/**
 * Model OperatorShift - Operasi Database untuk Shift & Absensi Operator
 */
class OperatorShiftModel {
  /**
   * Ambil semua jadwal shift dengan optional filter tanggal
   */
  static async findAll(startDate = null, endDate = null) {
    let query = `
      SELECT s.*, 
             TO_CHAR(s.tanggal, 'YYYY-MM-DD') AS tanggal_str,
             u.nama AS nama_operator, u.email, u.no_hp
      FROM operator_shifts s
      JOIN users u ON s.id_user = u.id_user
    `;
    const params = [];

    if (startDate && endDate) {
      query += ` WHERE s.tanggal BETWEEN ?::date AND ?::date`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY s.tanggal DESC, s.jam_mulai ASC`;

    const [rows] = await db.query(query, params);
    rows.forEach(r => {
      if (r.tanggal_str) r.tanggal = r.tanggal_str;
    });
    return rows;
  }

  /**
   * Ambil operator yang sedang piket/standby pada tanggal & jam tertentu
   */
  static async findActiveOperatorOnDuty(tanggal, jamMulai) {
    const [rows] = await db.query(
      `SELECT s.*, u.nama AS nama_operator, u.no_hp, u.email
       FROM operator_shifts s
       JOIN users u ON s.id_user = u.id_user
       WHERE s.tanggal::date = ?::date
         AND s.jam_mulai <= ?::time
         AND s.jam_selesai >= ?::time
         AND s.status_shift NOT IN ('absent', 'cancelled')
       ORDER BY s.jam_mulai ASC
       LIMIT 1`,
      [tanggal, jamMulai, jamMulai]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Ambil daftar semua user dengan role 'operator'
   */
  static async getAllOperators() {
    const [rows] = await db.query(
      `SELECT id_user, nama, email, no_hp, role, created_at
       FROM users
       WHERE role = 'operator'
       ORDER BY nama ASC`
    );
    return rows;
  }

  /**
   * Buat jadwal shift operator baru
   */
  static async create({ id_user, tanggal, jam_mulai, jam_selesai, catatan }) {
    const [result] = await db.query(
      `INSERT INTO operator_shifts (id_user, tanggal, jam_mulai, jam_selesai, catatan, status_shift)
       VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      [id_user, tanggal, jam_mulai, jam_selesai, catatan || null]
    );
    return result.insertId;
  }

  /**
   * Update status shift (misal: 'scheduled', 'present', 'absent', 'replaced')
   */
  static async updateStatus(id_shift, status_shift, catatan = null) {
    const [result] = await db.query(
      `UPDATE operator_shifts
       SET status_shift = ?, catatan = COALESCE(?, catatan)
       WHERE id_shift = ?`,
      [status_shift, catatan, id_shift]
    );
    return result.affectedRows;
  }

  /**
   * Hapus jadwal shift
   */
  static async delete(id_shift) {
    const [result] = await db.query(
      `DELETE FROM operator_shifts WHERE id_shift = ?`,
      [id_shift]
    );
    return result.affectedRows;
  }

  /**
   * Hitung statistik ketidakhadiran (absensi) per operator
   */
  static async getAttendanceStats() {
    const [rows] = await db.query(
      `SELECT u.id_user, u.nama AS nama_operator, u.no_hp,
              COUNT(s.id_shift) AS total_shift,
              COUNT(CASE WHEN s.status_shift = 'present' THEN 1 END) AS total_hadir,
              COUNT(CASE WHEN s.status_shift = 'absent' THEN 1 END) AS total_absen,
              COUNT(CASE WHEN s.status_shift = 'replaced' THEN 1 END) AS total_digantikan
       FROM users u
       LEFT JOIN operator_shifts s ON u.id_user = s.id_user
       WHERE u.role = 'operator'
       GROUP BY u.id_user, u.nama, u.no_hp
       ORDER BY total_absen DESC, u.nama ASC`
    );
    return rows;
  }
}

module.exports = OperatorShiftModel;
