const OperatorShiftModel = require('../models/operatorShift.model');

async function testShiftsApi() {
  console.log('--- Testing Operator Shift Queries ---');
  try {
    console.log('1. Testing findAll()...');
    const shifts = await OperatorShiftModel.findAll();
    console.log('✅ findAll() succeeded! Count:', shifts.length);

    console.log('\n2. Testing getAllOperators()...');
    const operators = await OperatorShiftModel.getAllOperators();
    console.log('✅ getAllOperators() succeeded! Count:', operators.length, operators);

    console.log('\n3. Testing getAttendanceStats()...');
    const stats = await OperatorShiftModel.getAttendanceStats();
    console.log('✅ getAttendanceStats() succeeded! Count:', stats.length, stats);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing shift queries:', err);
    process.exit(1);
  }
}

testShiftsApi();
