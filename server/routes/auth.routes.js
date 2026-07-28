/**
 * @module routes/auth
 * @description Route definitions untuk autentikasi (register, login, get current user)
 * @requires controllers/auth.controller
 * @requires middleware/auth.middleware
 */
const router = require('express').Router(); // Express router
const { register, login, getMe } = require('../controllers/auth.controller'); // Import auth controller functions
const { verifyToken } = require('../middleware/auth.middleware'); // Import auth middleware

/**
 * @route POST /api/auth/register
 * @description Registrasi user baru (customer)
 * @access Public
 * @body {string} email - Email user
 * @body {string} password - Password user
 * @body {string} nama - Nama lengkap user
 * @body {string} no_hp - Nomor HP user
 * @returns {201} User berhasil diregistrasi
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @description Login user untuk mendapatkan JWT token
 * @access Public
 * @body {string} email - Email user
 * @body {string} password - Password user
 * @returns {200} Login berhasil dengan token dan data user
 */
router.post('/login',    login);

/**
 * @route GET /api/auth/me
 * @description Ambil info user yang sedang login
 * @access Customer / Admin
 * @requires token
 * @returns {200} Data user yang sedang login
 */
router.get('/me',        verifyToken, getMe);

module.exports = router; // Export router
