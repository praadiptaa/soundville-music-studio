const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Image Upload Middleware - Multer Configuration for Multiple Categories
 * 
 * @description
 * Middleware untuk handle gambar uploads dari berbagai category dengan folder terpisah.
 * Digunakan untuk:
 * - Studio images (foto studio)
 * - Equipment images (foto peralatan)
 * - Booking images (foto dokumentasi booking)
 * - Package images (foto paket event)
 * 
 * Architecture:
 * 1. Buat 4 folder uploads terpisah (recursive)
 * 2. Tiap category punya storage config dengan folder & naming convention sendiri
 * 3. Semua category pakai imageFilter yang sama (JPG, PNG, WEBP)
 * 4. Export 4 multer instances: uploadStudio, uploadEquipment, uploadBooking, uploadPackage
 * 
 * Naming convention:
 * - Studio: studio-{timestamp}-{random}.{ext}
 * - Equipment: equipment-{timestamp}-{random}.{ext}
 * - Booking: booking-{timestamp}-{random}.{ext}
 * - Package: package-{timestamp}-{random}.{ext}
 * 
 * @usage
 * // Di routes file:
 * const { uploadStudio, uploadEquipment, uploadPackage } = require('../middleware/image-upload.middleware');
 * 
 * router.post('/api/studios/:id/upload-gambar', uploadStudio.single('gambar'), uploadStudioImage);
 * router.post('/api/event-equipment/:id/upload-gambar', uploadEquipment.single('gambar'), uploadEquipmentImage);
 * router.post('/api/event-packages/:id/upload-gambar', uploadPackage.single('gambar'), uploadPackageImage);
 * 
 * @note
 * - Folder otomatis dibuat dengan recursive: true
 * - Max file size: 5MB per file (semua category)
 * - Allowed types: JPG, PNG, WEBP (image only, no PDF)
 * - File disimpan dengan unique timestamp + random untuk prevent overwrite
 * - Double validation: extension AND mimetype
 * - Error thrown jika file tidak valid
 * 
 * @example
 * // Front-end submit
 * const formData = new FormData();
 * formData.append('gambar', fileInput.files[0]);
 * 
 * fetch('/api/event-packages/3/upload-gambar', {
 *   method: 'POST',
 *   headers: { 'Authorization': 'Bearer token...' },
 *   body: formData
 * });
 * 
 * // Backend save ke database
 * const filePath = `uploads/packages/${req.file.filename}`;
 * await EventPackageModel.uploadGambar(id, filePath);
 * 
 * // Stored files:
 * // - uploads/studios/studio-1718541234567-123456789.jpg
 * // - uploads/equipment/equipment-1718541234567-987654321.png
 * // - uploads/packages/package-1718541234567-555555555.webp
 * 
 * @todo
 * - Implement image resizing untuk multiple sizes (thumbnail, medium, large)
 * - Add image compression untuk reduce bandwidth
 * - Implement CDN integration untuk faster delivery
 * - Add metadata extraction (camera info, location EXIF data)
 * - Implement automatic cleanup untuk old images
 */

/**
 * Create upload directory dengan recursive option
 * @param {string} dir - Directory path
 */
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Define directory paths untuk berbagai tipe uploads
const studioDir = path.join(__dirname, '..', 'uploads', 'studios');
const equipmentDir = path.join(__dirname, '..', 'uploads', 'equipment');
const bookingsDir = path.join(__dirname, '..', 'uploads', 'bookings');
const packagesDir = path.join(__dirname, '..', 'uploads', 'packages');

// Create directories jika belum ada
createUploadDir(studioDir);
createUploadDir(equipmentDir);
createUploadDir(bookingsDir);
createUploadDir(packagesDir);

// ============ STORAGE CONFIGURATIONS ============

/**
 * Multer disk storage untuk studio images
 * Folder: uploads/studios/
 * Filename format: studio-{timestamp}-{random}.{ext}
 */
const studioStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, studioDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `studio-${uniqueSuffix}${ext}`);
  },
});

/**
 * Multer disk storage untuk equipment images
 * Folder: uploads/equipment/
 * Filename format: equipment-{timestamp}-{random}.{ext}
 */
const equipmentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, equipmentDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `equipment-${uniqueSuffix}${ext}`);
  },
});

/**
 * Multer disk storage untuk booking images
 * Folder: uploads/bookings/
 * Filename format: booking-{timestamp}-{random}.{ext}
 */
const bookingsStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, bookingsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `booking-${uniqueSuffix}${ext}`);
  },
});

/**
 * Multer disk storage untuk package images
 * Folder: uploads/packages/
 * Filename format: package-{timestamp}-{random}.{ext}
 */
const packagesStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, packagesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `package-${uniqueSuffix}${ext}`);
  },
});

// ============ FILE FILTER ============

/**
 * File filter untuk image uploads
 * Validasi file extension dan mimetype
 * Allowed: JPG, PNG, WEBP (no PDF untuk images)
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - File object dari multer
 * @param {Function} cb - Callback function
 * @returns {void} cb(null, true) jika valid, cb(error) jika invalid
 * 
 * @note
 * - Double validation: extension check + mimetype check
 * - Prevents fake file extension (e.g., .jpg file dengan mime text/plain)
 * - Case-insensitive extension check
 */
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Hanya file JPG, PNG, atau WEBP yang diizinkan.'));
};

// ============ MULTER INSTANCES ============

/**
 * Multer instance untuk studio image upload
 * @type {Object}
 * @property {Object} storage - studioStorage configuration
 * @property {Function} fileFilter - imageFilter function
 * @property {Object} limits - { fileSize: 5MB }
 * 
 * @usage router.post('/api/studios/:id/upload-gambar', uploadStudio.single('gambar'), handler);
 */
const uploadStudio = multer({
  storage: studioStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: imageFilter,
});

/**
 * Multer instance untuk equipment image upload
 * @type {Object}
 * @property {Object} storage - equipmentStorage configuration
 * @property {Function} fileFilter - imageFilter function
 * @property {Object} limits - { fileSize: 5MB }
 * 
 * @usage router.post('/api/event-equipment/:id/upload-gambar', uploadEquipment.single('gambar'), handler);
 */
const uploadEquipment = multer({
  storage: equipmentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: imageFilter,
});

/**
 * Multer instance untuk booking image upload
 * @type {Object}
 * @property {Object} storage - bookingsStorage configuration
 * @property {Function} fileFilter - imageFilter function
 * @property {Object} limits - { fileSize: 5MB }
 * 
 * @usage router.post('/api/bookings/:id/upload-dokumentasi', uploadBooking.single('gambar'), handler);
 */
const uploadBooking = multer({
  storage: bookingsStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: imageFilter,
});

/**
 * Multer instance untuk package image upload
 * @type {Object}
 * @property {Object} storage - packagesStorage configuration
 * @property {Function} fileFilter - imageFilter function
 * @property {Object} limits - { fileSize: 5MB }
 * 
 * @usage router.post('/api/event-packages/:id/upload-gambar', uploadPackage.single('gambar'), handler);
 */
const uploadPackage = multer({
  storage: packagesStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: imageFilter,
});

module.exports = {
  uploadStudio,
  uploadEquipment,
  uploadBooking,
  uploadPackage,
};
