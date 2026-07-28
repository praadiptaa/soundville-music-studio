try {
  console.log('Testing route imports...');
  require('../routes/auth.routes');
  require('../routes/studio.routes');
  require('../routes/booking.routes');
  require('../routes/payment.routes');
  require('../routes/event.routes');
  require('../routes/eventPackage.routes');
  require('../routes/eventEquipment.routes');
  require('../routes/eventService.routes');
  require('../routes/eventPayment.routes');
  require('../routes/user.routes');
  require('../routes/report.routes');
  console.log('✅ ALL 11 ROUTES LOADED SUCCESSFULLY!');
} catch (err) {
  console.error('❌ ROUTE IMPORT ERROR:', err);
  process.exit(1);
}
