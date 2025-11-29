const axios = require('axios');

// Configuration - Using custom domain
const RENDER_BACKEND_URL = 'https://api.praashibysupal.com'; // Your custom domain
const ADMIN_EMAIL = 'admin@praashibysupal.com';
const ADMIN_PASSWORD = 'Admin@123!Secure'; // Change this to a secure password

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user via API...');
    console.log(`Backend URL: ${RENDER_BACKEND_URL}`);
    
    // First, try to register the admin user
    console.log('📝 Registering admin user...');
    
    const registerResponse = await axios.post(`${RENDER_BACKEND_URL}/api/auth/register`, {
      name: 'System Administrator',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      phone: '+91-0000000000',
      role: 'admin' // This might need to be set after registration
    });

    console.log('✅ Admin user registered successfully!');
    console.log('Response:', registerResponse.data);

    // If registration doesn't set role, you might need to update it
    if (registerResponse.data.user && registerResponse.data.user.role !== 'admin') {
      console.log('⚠️  User created but role is not admin. You may need to update the role in your database.');
      console.log('   You can do this by:');
      console.log('   1. Logging into your database');
      console.log('   2. Running: UPDATE users SET role = "admin" WHERE email = "admin@praashibysupal.com";');
    }

  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️  Admin user already exists. Testing login...');
      
      // Test login with existing user
      try {
        const loginResponse = await axios.post(`${RENDER_BACKEND_URL}/api/auth/login`, {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        });
        
        console.log('✅ Login successful!');
        console.log('User role:', loginResponse.data.user.role);
        
        if (loginResponse.data.user.role !== 'admin') {
          console.log('⚠️  User exists but role is not admin. Please update the role in your database.');
        } else {
          console.log('🎉 Admin user is ready to use!');
        }
        
      } catch (loginError) {
        console.log('❌ Login failed. Please check the password or create the user manually.');
        console.log('Error:', loginError.response?.data?.message || loginError.message);
      }
      
    } else {
      console.error('❌ Error creating admin user:', error.response?.data?.message || error.message);
      console.log('\n🔧 Manual Setup Instructions:');
      console.log('1. Go to your database management tool');
      console.log('2. Run this SQL query:');
      console.log(`   INSERT INTO users (name, email, password, phone, role, is_active, created_at) 
                   VALUES ('System Administrator', '${ADMIN_EMAIL}', '${ADMIN_PASSWORD}', '+91-0000000000', 'admin', 1, NOW());`);
      console.log('3. Make sure to hash the password using bcrypt with salt rounds 12');
    }
  }
}

// Instructions
console.log('📋 Admin User Creation via API');
console.log('===============================');
console.log('');
console.log('Before running this script:');
console.log('1. Update RENDER_BACKEND_URL with your actual Render backend URL');
console.log('2. Update ADMIN_PASSWORD with a secure password');
console.log('3. Make sure your Render backend is running');
console.log('');

// Check if URL is still the placeholder
if (RENDER_BACKEND_URL.includes('your-render-backend-url')) {
  console.log('❌ Please update RENDER_BACKEND_URL with your actual Render backend URL first!');
  console.log('   Example: https://your-app-name.onrender.com');
  process.exit(1);
}

createAdminUser();
