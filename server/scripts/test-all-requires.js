try {
  console.log('Testing requiring api/index.js...');
  const app = require('../../api/index.js');
  console.log('✅ api/index.js loaded successfully!');

  console.log('Testing requiring server/index.js...');
  const server = require('../index.js');
  console.log('✅ server/index.js loaded successfully!');

  console.log('Testing requiring database.js...');
  const db = require('../config/database.js');
  console.log('✅ database.js loaded successfully!');

  console.log('🎉 ALL SERVER REQUIRES SUCCESSFUL!');
  process.exit(0);
} catch (err) {
  console.error('❌ REQUIRE FAILED:', err);
  process.exit(1);
}
