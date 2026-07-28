const { getAllShifts } = require('../controllers/operatorShift.controller');

async function testShiftsController() {
  const req = { query: {} };
  const res = {
    json(data) {
      console.log('✅ Controller Response Success:', data);
      process.exit(0);
    },
    status(code) {
      return {
        json(data) {
          console.error(`❌ Controller Response Error (${code}):`, data);
          process.exit(1);
        }
      };
    }
  };

  console.log('Testing getAllShifts controller...');
  await getAllShifts(req, res);
}

testShiftsController();
