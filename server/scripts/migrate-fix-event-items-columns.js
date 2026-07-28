const db = require('../config/database');

async function migrate() {
  try {
    console.log('[Migration] Checking and fixing event_rentals and event_orders tables...');

    // 1. Check event_rentals columns
    const [rentalsCols] = await db.query('DESCRIBE event_rentals');
    const hasQty = rentalsCols.some(col => col.Field === 'qty');
    const hasHargaSatuan = rentalsCols.some(col => col.Field === 'harga_satuan');
    const hasDurasiHari = rentalsCols.some(col => col.Field === 'durasi_hari');
    const hasHargaSewa = rentalsCols.some(col => col.Field === 'harga_sewa');

    // Rename durasi_hari -> qty if durasi_hari exists and qty does not
    if (hasDurasiHari && !hasQty) {
      console.log('-> Renaming durasi_hari to qty in event_rentals...');
      await db.query('ALTER TABLE event_rentals CHANGE durasi_hari qty INT NOT NULL DEFAULT 1');
      console.log('✅ Column durasi_hari renamed to qty');
    } else if (!hasQty) {
      console.log('-> Adding qty to event_rentals...');
      await db.query('ALTER TABLE event_rentals ADD COLUMN qty INT NOT NULL DEFAULT 1 AFTER id_equipment');
      console.log('✅ Column qty added');
    }

    // Rename harga_sewa -> harga_satuan if harga_sewa exists and harga_satuan does not
    if (hasHargaSewa && !hasHargaSatuan) {
      console.log('-> Renaming harga_sewa to harga_satuan in event_rentals...');
      await db.query('ALTER TABLE event_rentals CHANGE harga_sewa harga_satuan DECIMAL(10,2) NOT NULL');
      console.log('✅ Column harga_sewa renamed to harga_satuan');
    } else if (!hasHargaSatuan) {
      console.log('-> Adding harga_satuan to event_rentals...');
      await db.query('ALTER TABLE event_rentals ADD COLUMN harga_satuan DECIMAL(10,2) NOT NULL AFTER qty');
      console.log('✅ Column harga_satuan added');
    }

    // 2. Check event_orders columns
    const [ordersCols] = await db.query('DESCRIBE event_orders');
    const hasQtyInOrders = ordersCols.some(col => col.Field === 'qty');
    if (!hasQtyInOrders) {
      console.log('-> Adding qty to event_orders...');
      await db.query('ALTER TABLE event_orders ADD COLUMN qty INT NOT NULL DEFAULT 1 AFTER id_service');
      console.log('✅ Column qty added to event_orders');
    }

    console.log('✅ Migration successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
