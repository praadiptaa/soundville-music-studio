/**
 * Migration: Make metode column nullable in payments table
 * Reason: metode hanya di-set saat admin mark as "Lunas", tidak saat customer upload DP
 */

const db = require('../config/database');

const migrate = async () => {
  try {
    console.log('[Migration] Making payments.metode column nullable...');
    
    await db.query(`
      ALTER TABLE payments 
      MODIFY metode VARCHAR(50) NULL DEFAULT NULL
    `);
    
    console.log('✅ Migration successful: payments.metode is now nullable');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
