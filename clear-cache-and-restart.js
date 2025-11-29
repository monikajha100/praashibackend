const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing cache and restarting development server...\n');

async function clearCacheAndRestart() {
  try {
    // Step 1: Clear React build cache
    console.log('1. Clearing React build cache...');
    const frontendCacheDir = path.join(__dirname, 'frontend', 'node_modules', '.cache');
    if (fs.existsSync(frontendCacheDir)) {
      await exec(`rmdir /s /q "${frontendCacheDir}"`, { shell: true });
      console.log('✅ React cache cleared');
    } else {
      console.log('✅ No React cache found');
    }

    // Step 2: Clear any temporary files
    console.log('2. Clearing temporary files...');
    const tempFiles = [
      'frontend/src/admin/pages/AdminDashboard.js',
      'frontend/src/admin/pages/AdminDashboard.js.bak',
      'frontend/src/admin/pages/AdminDashboard.js.tmp'
    ];

    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✅ Removed ${file}`);
      }
    }

    // Step 3: Kill any existing processes
    console.log('3. Killing existing processes...');
    try {
      await exec('taskkill /f /im node.exe', { shell: true });
      console.log('✅ Existing Node processes killed');
    } catch (error) {
      console.log('✅ No existing Node processes found');
    }

    // Step 4: Start frontend server
    console.log('4. Starting frontend development server...');
    const frontendProcess = spawn('npm', ['start'], {
      cwd: 'frontend',
      stdio: 'inherit',
      shell: true,
      detached: true
    });

    console.log('\n🎉 Development server restarted!');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔐 Admin Panel: http://localhost:3000/admin/login');
    console.log('\n📋 Admin Credentials:');
    console.log('Email: admin@praashibysupal.com');
    console.log('Password: admin123');

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      frontendProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Manual steps:');
    console.log('1. Close all terminal windows');
    console.log('2. Delete frontend/node_modules/.cache folder');
    console.log('3. Run: cd frontend && npm start');
  }
}

clearCacheAndRestart();
