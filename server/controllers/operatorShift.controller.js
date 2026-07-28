const OperatorShiftModel = require('../models/operatorShift.model');
const UserModel = require('../models/user.model');

/**
 * Controller Manajemen Shift & Absensi Operator
 */

/**
 * Ambil semua jadwal shift, daftar operator, dan statistik absensi
 * @route GET /api/shifts
 */
const getAllShifts = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const shifts = await OperatorShiftModel.findAll(start_date, end_date);
    const operators = await OperatorShiftModel.getAllOperators();
    const stats = await OperatorShiftModel.getAttendanceStats();

    res.json({
      success: true,
      data: {
        shifts,
        operators,
        stats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Buat jadwal shift operator baru (Admin)
 * @route POST /api/shifts
 */
const createShift = async (req, res) => {
  try {
    const { id_user, tanggal, jam_mulai, jam_selesai, catatan } = req.body;

    if (!id_user || !tanggal || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ success: false, message: 'Operator, tanggal, jam mulai, dan jam selesai wajib diisi.' });
    }

    const id_shift = await OperatorShiftModel.create({
      id_user, tanggal, jam_mulai, jam_selesai, catatan
    });

    res.status(201).json({
      success: true,
      message: 'Jadwal shift operator berhasil ditambahkan.',
      data: { id_shift }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update status absensi/kehadiran shift (Admin / Operator)
 * @route PUT /api/shifts/:id
 */
const updateShiftStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_shift, catatan } = req.body;

    const validStatus = ['scheduled', 'present', 'absent', 'replaced'];
    if (!validStatus.includes(status_shift)) {
      return res.status(400).json({ success: false, message: 'Status shift tidak valid.' });
    }

    const affected = await OperatorShiftModel.updateStatus(id, status_shift, catatan);
    if (!affected) {
      return res.status(404).json({ success: false, message: 'Jadwal shift tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: `Status shift diubah menjadi "${status_shift}".`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Hapus jadwal shift (Admin)
 * @route DELETE /api/shifts/:id
 */
const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await OperatorShiftModel.delete(id);
    if (!affected) {
      return res.status(404).json({ success: false, message: 'Jadwal shift tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Jadwal shift berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Ambil data WA reminder untuk operator piket pada tanggal & jam tertentu
 * @route GET /api/shifts/reminder
 */
const getOperatorWaReminder = async (req, res) => {
  try {
    const { tanggal, jam_mulai, nama_studio, nama_customer } = req.query;

    if (!tanggal || !jam_mulai) {
      return res.status(400).json({ success: false, message: 'Tanggal dan jam mulai wajib diisi.' });
    }

    const activeOperator = await OperatorShiftModel.findActiveOperatorOnDuty(tanggal, jam_mulai);

    if (!activeOperator) {
      // Jika tidak ada shift spesifik, ambil operator pertama dari list sebagai fallback
      const operators = await OperatorShiftModel.getAllOperators();
      if (operators.length === 0) {
        return res.status(404).json({ success: false, message: 'Belum ada operator terdaftar di sistem.' });
      }
      const op = operators[0];
      return res.json({
        success: true,
        data: {
          nama_operator: op.nama,
          no_hp: op.no_hp,
          is_scheduled: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        nama_operator: activeOperator.nama_operator,
        no_hp: activeOperator.no_hp,
        is_scheduled: true,
        shift: {
          jam_mulai: activeOperator.jam_mulai,
          jam_selesai: activeOperator.jam_selesai
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllShifts,
  createShift,
  updateShiftStatus,
  deleteShift,
  getOperatorWaReminder
};
