try {
  console.log('Testing controllers imports...');
  require('../controllers/auth.controller');
  require('../controllers/booking.controller');
  require('../controllers/event.controller');
  require('../controllers/eventEquipment.controller');
  require('../controllers/eventPackage.controller');
  require('../controllers/eventPayment.controller');
  require('../controllers/eventService.controller');
  require('../controllers/payment.controller');
  require('../controllers/report.controller');
  require('../controllers/studio.controller');
  require('../controllers/user.controller');
  console.log('✅ ALL CONTROLLERS LOADED CLEANLY!');
} catch (err) {
  console.error('❌ CONTROLLER LOAD ERROR:', err);
  process.exit(1);
}
