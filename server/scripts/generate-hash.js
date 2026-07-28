/**
 * Generate bcrypt hash untuk password
 * Jalankan: node scripts/generate-hash.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
};

const DB_NAME = process.env.DB_NAME || 'soundville_db';

async function generateAndUpdateHash() {
  let connection;

  try {
    const password = 'admin123';
    console.log(`\nMeng-generate hash untuk password: "${password}"`);
    
    // Generate hash
    const hash = await bcrypt.hash(password, 10);
    console.log(`\nHash yang dihasilkan:`);
    console.log(`${hash}\n`);

    // Update database
    console.log('Menghubungkan ke database...');
    connection = await mysql.createConnection({...DB_CONFIG, database: DB_NAME});
    
    console.log('Updating password admin di database...');
    await connection.query(
      "UPDATE users SET password = ? WHERE email = 'admin@soundville.com'",
      [hash]
    );
    
    console.log('✅ Password admin berhasil di-update!');
    console.log('\nKini kamu bisa login dengan:');
    console.log(`  Email: admin@soundville.com`);
    console.log(`  Password: ${password}\n`);

    await connection.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

generateAndUpdateHash();
