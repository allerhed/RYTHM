// Quick script to test admin login
// Run with: node login-admin.js

const login = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'orchestrator@rythm.app',
        password: 'Password123'
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', data.user);
      console.log('Token:', data.token);
      console.log('\n🔗 To use in browser:');
      console.log('1. Open browser dev tools (F12)');
      console.log('2. Go to Application/Storage → Local Storage → http://localhost:3002');
      console.log('3. Add these entries:');
      console.log(`   admin_token: ${data.token}`);
      console.log(`   admin_user: ${JSON.stringify(data.user)}`);
      console.log('4. Refresh the page');
    } else {
      console.log('❌ Login failed:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

login();