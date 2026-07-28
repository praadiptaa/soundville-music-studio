require('dotenv').config();
const BookingModel = require('../models/booking.model');

async function check() {
  try {
    const res = await BookingModel.getScheduleByStudioAndMonth(1, 2026, 6);
    console.log("Schedule for Studio 1, June 2026:", JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
