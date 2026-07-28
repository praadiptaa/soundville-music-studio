const router = require('express').Router();
const { getAllUsers, getUserById, updateUser, deleteUser, updateUserRole } = require('../controllers/user.controller');
const { verifyToken, isAdmin, isStaff } = require('../middleware/auth.middleware');

// GET /api/users - Admin & Operator bisa lihat daftar pengguna
router.get('/', verifyToken, isStaff, getAllUsers);

// GET /api/users/:id - Profil user
router.get('/:id', verifyToken, getUserById);

// PUT /api/users/:id - Update profil user
router.put('/:id', verifyToken, updateUser);

// PUT /api/users/:id/role - KHUSUS ADMIN yang bisa ubah role user (admin / operator / customer)
router.put('/:id/role', verifyToken, isAdmin, updateUserRole);

// DELETE /api/users/:id - KHUSUS ADMIN yang bisa hapus user
router.delete('/:id', verifyToken, isAdmin, deleteUser);

module.exports = router;
