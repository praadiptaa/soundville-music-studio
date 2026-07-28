/**
 * @module routes/user
 * @description Route definitions untuk user/customer profile management (CRUD)
 * @requires controllers/user.controller
 * @requires middleware/auth.middleware
 */
const router = require('express').Router(); // Express router
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/user.controller'); // Import user controller functions
const { verifyToken, isAdmin } = require('../middleware/auth.middleware'); // Import auth middleware

/**
 * @route GET /api/users
 * @description Admin mengambil seluruh data registrasi user/customer
 * @access Admin only
 * @requires token
 * @returns {200} List seluruh user
 */
router.get('/',     verifyToken, isAdmin, getAllUsers);

/**
 * @route GET /api/users/:id
 * @description Mengambil detail profile user berdasarkan ID
 * @access Customer (milik sendiri) / Admin
 * @requires token
 * @param {number} id - ID User
 * @returns {200} Detail profile user
 */
router.get('/:id',  verifyToken, getUserById);

/**
 * @route PUT /api/users/:id
 * @description Update data profile user (nama, no_hp, password)
 * @access Customer (milik sendiri) / Admin
 * @requires token
 * @param {number} id - ID User
 * @body {string} nama - Nama lengkap
 * @body {string} no_hp - Nomor HP/telepon
 * @body {string} [password] - Password baru (opsional)
 * @returns {200} Profile berhasil diperbarui
 */
router.put('/:id',  verifyToken, updateUser);

/**
 * @route DELETE /api/users/:id
 * @description Admin menghapus user dari database
 * @access Admin only
 * @requires token
 * @param {number} id - ID User
 * @returns {200} User berhasil dihapus
 */
router.delete('/:id', verifyToken, isAdmin, deleteUser);

module.exports = router; // Export router
