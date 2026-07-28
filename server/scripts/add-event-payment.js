const db = require('../config/database');

async function migrate() {
  try {
    console.log('Creating event_payments table if not exists...');

    await db.query(`
      CREATE TABLE IF NOT EXISTS event_payments (
        id_event_payment INT AUTO_INCREMENT PRIMARY KEY,
        id_event INT NOT NULL UNIQUE,
        metode VARCHAR(50) NOT NULL DEFAULT 'transfer',
        bukti_transfer VARCHAR(255) DEFAULT NULL,
        status_payment ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
        tanggal_payment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        catatan_admin TEXT DEFAULT NULL,
        CONSTRAINT fk_event_payment_event FOREIGN KEY (id_event) REFERENCES events(id_event) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    console.log('✓ event_payments table ready');

    console.log('Migration completed!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
