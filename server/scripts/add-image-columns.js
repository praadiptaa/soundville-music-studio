const db = require('../config/database');

async function migrate() {
  try {
    console.log('🔧 Adding image columns to database tables...\n');

    // Add gambar to event_equipment
    console.log('Adding gambar column to event_equipment...');
    try {
      await db.query(`
        ALTER TABLE event_equipment 
        ADD COLUMN gambar VARCHAR(255) DEFAULT NULL AFTER durasi_hari
      `);
      console.log('✅ gambar column added to event_equipment');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  ~ gambar column already exists in event_equipment');
      } else {
        throw err;
      }
    }

    // Add gambar to bookings
    console.log('Adding gambar column to bookings...');
    try {
      await db.query(`
        ALTER TABLE bookings 
        ADD COLUMN gambar VARCHAR(255) DEFAULT NULL AFTER catatan_cancel
      `);
      console.log('✅ gambar column added to bookings');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  ~ gambar column already exists in bookings');
      } else {
        throw err;
      }
    }

    // Add gambar to event_packages
    console.log('Adding gambar column to event_packages...');
    try {
      await db.query(`
        ALTER TABLE event_packages 
        ADD COLUMN gambar VARCHAR(255) DEFAULT NULL AFTER fasilitas
      `);
      console.log('✅ gambar column added to event_packages');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('  ~ gambar column already exists in event_packages');
      } else {
        throw err;
      }
    }

    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
