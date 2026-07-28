/**
 * @module routes/report
 * @description Route definitions untuk statistik dashboard dan laporan transaksi keuangan studio/event
 * @requires controllers/report.controller
 * @requires middleware/auth.middleware
 */
const router = require('express').Router(); // Express router
const { getDashboardStats, getTransactionReport } = require('../controllers/report.controller'); // Import report controller functions
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Import auth middleware

/**
 * @route GET /api/reports/dashboard
 * @description Admin mengambil data statistik ringkasan dashboard (total booking, event, user, revenue)
 * @access Admin only
 * @requires token
 * @returns {200} Statistik dashboard
 */
router.get('/dashboard',     verifyToken, isAdmin, getDashboardStats);

/**
 * @route GET /api/reports/transactions
 * @description Admin mengambil laporan detail transaksi keuangan berdasarkan filter bulan/tahun/tipe
 * @access Admin only
 * @requires token
 * @query {string} [startDate] - Filter tanggal mulai (YYYY-MM-DD)
 * @query {string} [endDate] - Filter tanggal akhir (YYYY-MM-DD)
 * @query {string} [type] - Filter tipe ('all', 'studio', 'event')
 * @returns {200} List transaksi keuangan
 */
router.get('/transactions',  verifyToken, isAdmin, getTransactionReport);

module.exports = router; // Export router
