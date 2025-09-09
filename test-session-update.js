const fetch = require('node-fetch');

// Test data
const sessionId = '6440e921-6017-48e4-8810-cabb453c17ad'; // Known session ID from our database query
const updateData = {
  name: 'Test API Workout Name',
  category: 'strength',
  notes: 'Testing the workout name update functionality',
  training_load: 75,
  perceived_exertion: 7,
  exercises: []
};

// You'll need to get a real JWT token from the app or create one
const token = 'NEED_REAL_TOKEN'; // This needs to be replaced with a real token

async function testSessionUpdate() {
  try {
    console.log('Testing session update API...');
    console.log('Session ID:', sessionId);
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const result = await response.text();
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Error testing session update:', error);
  }
}

console.log('This test script requires a valid JWT token to work.');
console.log('You can get one by logging into the app and checking the browser dev tools.');
console.log('Replace NEED_REAL_TOKEN with a real token and run: node test-session-update.js');