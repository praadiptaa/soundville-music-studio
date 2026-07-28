const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function update() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await db.query(`
      UPDATE users SET password = ? WHERE email = 'test2@gmail.com'
    `, [hash]);
    console.log('✅ Password test2@gmail.com updated to admin123');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

update();
