const db = require('../config/database');

async function testConnection() {
  console.log('Testing db.query()...');
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('✅ Connection Test Succeeded:', rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Test Failed:', err.message);
    process.exit(1);
  }
}

testConnection();
