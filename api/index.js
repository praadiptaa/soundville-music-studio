const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

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
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../server/uploads')));

// Import routes
const authRoutes      = require('../server/routes/auth.routes');
const studioRoutes    = require('../server/routes/studio.routes');
const bookingRoutes   = require('../server/routes/booking.routes');
const paymentRoutes   = require('../server/routes/payment.routes');
const eventRoutes     = require('../server/routes/event.routes');
const eventPkgRoutes  = require('../server/routes/eventPackage.routes');
const eventEquipRoutes = require('../server/routes/eventEquipment.routes');
const eventSvcRoutes  = require('../server/routes/eventService.routes');
const eventPaymentRoutes = require('../server/routes/eventPayment.routes');
const userRoutes      = require('../server/routes/user.routes');
const reportRoutes    = require('../server/routes/report.routes');

// Register routes
app.use('/api/auth',            authRoutes);
app.use('/api/studios',         studioRoutes);
app.use('/api/bookings',        bookingRoutes);
app.use('/api/payments',        paymentRoutes);
app.use('/api/events',          eventRoutes);
app.use('/api/event-packages',  eventPkgRoutes);
app.use('/api/event-equipment', eventEquipRoutes);
app.use('/api/event-services',  eventSvcRoutes);
app.use('/api/event-payments',  eventPaymentRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/reports',         reportRoutes);

// Health check endpoint
app.get(['/', '/api'], (req, res) => {
  res.json({ success: true, message: 'Soundville Music Studio API is running on Vercel' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Vercel Express Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

module.exports = app;
