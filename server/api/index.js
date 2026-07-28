const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

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

// Health check endpoint (Dipasang di paling atas agar fast response & 100% reliable)
app.get(['/', '/api', '/api/health'], (req, res) => {
  res.status(200).json({ success: true, message: 'Soundville Music Studio API is running on Vercel' });
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import routes
const authRoutes      = require('../routes/auth.routes');
const studioRoutes    = require('../routes/studio.routes');
const bookingRoutes   = require('../routes/booking.routes');
const paymentRoutes   = require('../routes/payment.routes');
const eventRoutes     = require('../routes/event.routes');
const eventPkgRoutes  = require('../routes/eventPackage.routes');
const eventEquipRoutes = require('../routes/eventEquipment.routes');
const eventSvcRoutes  = require('../routes/eventService.routes');
const eventPaymentRoutes = require('../routes/eventPayment.routes');
const userRoutes      = require('../routes/user.routes');
const reportRoutes    = require('../routes/report.routes');

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

app.use((err, req, res, next) => {
  console.error('Vercel Express Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

module.exports = app;
