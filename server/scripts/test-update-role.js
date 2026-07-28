const UserModel = require('../models/user.model');
const db = require('../config/database');

async function testRoleUpdate() {
  console.log('--- Testing Role Update in PostgreSQL ---');
  try {
    const users = await UserModel.findAll();
    console.log('Found users:', users.map(u => ({ id: u.id_user, nama: u.nama, role: u.role })));

    if (users.length > 0) {
      const target = users.find(u => u.role !== 'admin') || users[0];
      console.log(`\nTesting updateRole for user ID ${target.id_user} (${target.nama}), current role: ${target.role}...`);
      
      const affected = await UserModel.updateRole(target.id_user, 'operator');
      console.log('Affected rows:', affected);

      const updated = await UserModel.findById(target.id_user);
      console.log('Updated user in DB:', updated);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating role:', err);
    process.exit(1);
  }
}

testRoleUpdate();
