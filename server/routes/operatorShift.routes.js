const express = require('express');
const router = express.Router();
const {
  getAllShifts,
  createShift,
  updateShiftStatus,
  deleteShift,
  getOperatorWaReminder
} = require('../controllers/operatorShift.controller');
const { verifyToken, isAdmin, isStaff } = require('../middleware/auth.middleware');

// GET /api/shifts - Ambil semua shift & stats (bisa diakses admin & operator)
router.get('/', verifyToken, isStaff, getAllShifts);

// GET /api/shifts/reminder - Ambil info operator piket & template WA (bisa diakses admin & operator)
router.get('/reminder', verifyToken, isStaff, getOperatorWaReminder);

// POST /api/shifts - Admin membuat shift baru
router.post('/', verifyToken, isAdmin, createShift);

// PUT /api/shifts/:id - Admin/Operator update status kehadiran shift
router.put('/:id', verifyToken, isStaff, updateShiftStatus);

// DELETE /api/shifts/:id - Admin menghapus shift
router.delete('/:id', verifyToken, isAdmin, deleteShift);

module.exports = router;
