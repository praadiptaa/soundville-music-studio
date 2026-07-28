/**
 * Migration: Make metode column nullable in event_payments table
 * Reason: metode hanya di-set saat admin verifikasi, tidak saat customer upload DP
 */

const db = require('../config/database');

const migrate = async () => {
  try {
    console.log('[Migration] Making event_payments.metode column nullable...');
    
    await db.query(`
      ALTER TABLE event_payments 
      MODIFY metode VARCHAR(50) NULL DEFAULT NULL
    `);
    
    console.log('✅ Migration successful: event_payments.metode is now nullable');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
