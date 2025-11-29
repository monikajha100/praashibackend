const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Admin System...\n');

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function setupAdminSystem() {
  try {
    // Step 1: Check if .env file exists, if not create it from env.local
    console.log('📋 Step 1: Setting up environment variables...');
    if (!fs.existsSync('.env') && fs.existsSync('env.local')) {
      console.log('Creating .env file from env.local...');
      const envContent = fs.readFileSync('env.local', 'utf8');
      fs.writeFileSync('.env', envContent);
      console.log('✅ .env file created successfully');
    } else {
      console.log('✅ Environment file already exists');
    }

    // Step 2: Install dependencies if needed
    console.log('\n📦 Step 2: Checking dependencies...');
    if (!fs.existsSync('node_modules')) {
      console.log('Installing backend dependencies...');
      await runCommand('npm', ['install']);
      console.log('✅ Backend dependencies installed');
    } else {
      console.log('✅ Backend dependencies already installed');
    }

    if (!fs.existsSync('frontend/node_modules')) {
      console.log('Installing frontend dependencies...');
      await runCommand('npm', ['install'], { cwd: 'frontend' });
      console.log('✅ Frontend dependencies installed');
    } else {
      console.log('✅ Frontend dependencies already installed');
    }

    // Step 3: Setup database
    console.log('\n🗄️ Step 3: Setting up database...');
    try {
      await runCommand('node', ['setup-admin-database.js']);
      console.log('✅ Database setup completed');
    } catch (error) {
      console.log('⚠️ Database setup failed, but continuing...');
      console.log('You may need to set up the database manually');
    }

    // Step 4: Start backend server
    console.log('\n🖥️ Step 4: Starting backend server...');
    console.log('Backend server will start in the background...');
    
    const backendProcess = spawn('node', ['start-backend.js'], {
      stdio: 'pipe',
      detached: true
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.log(`Backend Error: ${data.toString().trim()}`);
    });

    // Give the backend server time to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 5: Start frontend server
    console.log('\n🌐 Step 5: Starting frontend server...');
    console.log('Frontend server will start in the background...');
    
    const frontendProcess = spawn('npm', ['start'], {
      cwd: 'frontend',
      stdio: 'pipe',
      detached: true
    });

    frontendProcess.stdout.on('data', (data) => {
      console.log(`Frontend: ${data.toString().trim()}`);
    });

    frontendProcess.stderr.on('data', (data) => {
      console.log(`Frontend Error: ${data.toString().trim()}`);
    });

    console.log('\n🎉 Admin System Setup Complete!');
    console.log('\n📋 Access Information:');
    console.log('🌐 Website: http://localhost:3000');
    console.log('🔐 Admin Panel: http://localhost:3000/admin/login');
    console.log('📧 Admin Email: admin@praashibysupal.com');
    console.log('🔑 Admin Password: admin123');
    console.log('🖥️ Backend API: http://localhost:5000');
    
    console.log('\n⚠️ Note: If you see any errors, please check:');
    console.log('1. MySQL server is running');
    console.log('2. Database credentials in .env file are correct');
    console.log('3. Ports 3000 and 5000 are available');

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Manual Setup Instructions:');
    console.log('1. Copy env.local to .env');
    console.log('2. Run: node setup-admin-database.js');
    console.log('3. Run: node start-backend.js (in one terminal)');
    console.log('4. Run: cd frontend && npm start (in another terminal)');
  }
}

setupAdminSystem();
