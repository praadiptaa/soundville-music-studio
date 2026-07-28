// Import dependencies
const express = require('express'); // Framework web server
const cors = require('cors'); // Middleware untuk cross-origin requests
const dotenv = require('dotenv'); // Load environment variables
const path = require('path'); // Utility untuk path handling

dotenv.config(); // Initialize environment variables dari .env file

const app = express(); // Initialize Express application

// Middleware setup
// Allowed origins untuk CORS (termasuk domain InfinityFree dari env CLIENT_URL)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.CORS_ALLOW_ALL === 'true' || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Memungkinkan fleksibilitas domain frontend pada InfinityFree
    }
  },
  credentials: true,
}));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Debug logger middleware - log setiap request ke console
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString('id-ID')}] ${req.method} ${req.path}`);
  next();
});

// Serve static files dari folder uploads (untuk bukti pembayaran dan gambar)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes untuk setiap resource API
const authRoutes      = require('./routes/auth.routes'); // Authentication endpoints
const studioRoutes    = require('./routes/studio.routes'); // Studio management endpoints
const bookingRoutes   = require('./routes/booking.routes'); // Booking endpoints
const paymentRoutes   = require('./routes/payment.routes'); // Payment endpoints
const eventRoutes     = require('./routes/event.routes'); // Event endpoints
const eventPkgRoutes  = require('./routes/eventPackage.routes'); // Event package endpoints
const eventEquipRoutes = require('./routes/eventEquipment.routes'); // Event equipment endpoints
const eventSvcRoutes  = require('./routes/eventService.routes'); // Event service endpoints
const eventPaymentRoutes = require('./routes/eventPayment.routes'); // Event payment endpoints
const userRoutes      = require('./routes/user.routes'); // User management endpoints
const reportRoutes    = require('./routes/report.routes'); // Report endpoints

// Register semua routes dengan prefix /api
app.use('/api/auth',            authRoutes); // Prefix /api/auth untuk auth routes
app.use('/api/studios',         studioRoutes); // Prefix /api/studios untuk studio routes
app.use('/api/bookings',        bookingRoutes); // Prefix /api/bookings untuk booking routes
app.use('/api/payments',        paymentRoutes); // Prefix /api/payments untuk payment routes
app.use('/api/events',          eventRoutes); // Prefix /api/events untuk event routes
app.use('/api/event-packages',  eventPkgRoutes); // Prefix /api/event-packages untuk event package routes
app.use('/api/event-equipment', eventEquipRoutes); // Prefix /api/event-equipment untuk equipment routes
app.use('/api/event-services',  eventSvcRoutes); // Prefix /api/event-services untuk service routes
app.use('/api/event-payments',  eventPaymentRoutes); // Prefix /api/event-payments untuk event payment routes
app.use('/api/users',           userRoutes); // Prefix /api/users untuk user routes
app.use('/api/reports',         reportRoutes); // Prefix /api/reports untuk report routes

// Health check endpoint - untuk verifikasi server berjalan
app.get('/', (req, res) => {
  res.json({ message: 'Soundville Music Studio API is running' });
});

// Global error handler middleware - menangani semua error di aplikasi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Start server di port yang ditentukan di .env atau default 5000 (jika bukan di Vercel Serverless)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
  });
}

module.exports = app; // Export app untuk testing
