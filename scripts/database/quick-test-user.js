#!/usr/bin/env node

/**
 * Quick Test User Creation
 * 
 * Simple script for agents to quickly create a test user
 * Usage: node scripts/database/quick-test-user.js [email] [password]
 */

require('dotenv').config({ path: '.env.local' });

async function quickTestUser() {
  const email = process.argv[2] || `quicktest-${Date.now()}@suspicious.com`;
  const password = process.argv[3] || 'testpassword123';
  
  try {
    const response = await fetch('http://localhost:3000/api/dev/create-test-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        metadata: {
          full_name: 'Quick Test User',
          experience_level: 'beginner'
        }
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Test user created successfully!');
      console.log('');
      console.log('📧 Email:', result.data.email);
      console.log('🔑 Password:', result.data.password);
      console.log('👤 User ID:', result.data.user.id);
      console.log('🎫 Session:', result.data.session ? 'Active' : 'None');
      console.log('');
      console.log('🧪 Ready for testing!');
      
      // Show usage examples
      console.log('');
      console.log('💡 Usage Examples:');
      console.log('   • Sign in UI: Use the email/password above');
      console.log('   • API testing: Use the session token');
      console.log('   • Component testing: Import user data');
      
    } else {
      console.error('❌ Failed to create test user:', result.error);
    }
  } catch (error) {
    console.error('💥 Script error:', error.message);
    console.log('');
    console.log('💡 Make sure:');
    console.log('   • Development server is running (npm run dev)');
    console.log('   • Environment variables are loaded');
    console.log('   • You are in development mode');
  }
}

// Check if server is likely running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/dev/create-test-user');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Quick Test User Creation\n');
  
  // Check if server is running
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('⚠️  Development server not detected');
    console.log('   Please run: npm run dev');
    console.log('   Then try again\n');
    process.exit(1);
  }
  
  await quickTestUser();
}

main().catch(console.error);