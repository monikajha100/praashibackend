const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

console.log('🔧 Fixing Admin Dashboard Error...\n');

async function fixAdminError() {
  try {
    // Step 1: Kill all Node processes
    console.log('1. Killing existing Node processes...');
    try {
      await exec('taskkill /f /im node.exe', { shell: true });
      console.log('✅ Node processes killed');
    } catch (error) {
      console.log('✅ No Node processes to kill');
    }

    // Step 2: Clear React cache
    console.log('2. Clearing React development cache...');
    const cachePaths = [
      'frontend/node_modules/.cache',
      'frontend/.eslintcache',
      'frontend/build',
      'frontend/dist'
    ];

    for (const cachePath of cachePaths) {
      if (fs.existsSync(cachePath)) {
        await exec(`rmdir /s /q "${cachePath}"`, { shell: true });
        console.log(`✅ Cleared ${cachePath}`);
      }
    }

    // Step 3: Remove any temporary AdminDashboard files
    console.log('3. Removing temporary files...');
    const tempFiles = [
      'frontend/src/admin/pages/AdminDashboard.js',
      'frontend/src/admin/pages/AdminDashboard.js.bak',
      'frontend/src/admin/pages/AdminDashboard.js.tmp',
      'frontend/src/admin/pages/AdminDashboard.js.old'
    ];

    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✅ Removed ${file}`);
      }
    }

    // Step 4: Verify the correct files exist
    console.log('4. Verifying admin files...');
    const requiredFiles = [
      'frontend/src/admin/pages/AdminDashboardNew.js',
      'frontend/src/admin/pages/DatabaseAdminLogin.js',
      'frontend/src/App.js'
    ];

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
      }
    }

    // Step 5: Check App.js imports
    console.log('5. Checking App.js imports...');
    const appJsContent = fs.readFileSync('frontend/src/App.js', 'utf8');
    if (appJsContent.includes('AdminDashboardNew')) {
      console.log('✅ App.js imports AdminDashboardNew');
    } else {
      console.log('❌ App.js does not import AdminDashboardNew');
    }

    // Step 6: Start frontend server
    console.log('6. Starting frontend development server...');
    const frontendProcess = spawn('npm', ['start'], {
      cwd: 'frontend',
      stdio: 'inherit',
      shell: true,
      detached: true
    });

    console.log('\n🎉 Admin Error Fix Complete!');
    console.log('\n📋 Access Information:');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔐 Admin Panel: http://localhost:3000/admin/login');
    console.log('📧 Admin Email: admin@praashibysupal.com');
    console.log('🔑 Admin Password: admin123');
    
    console.log('\n⚠️ If you still see the error:');
    console.log('1. Wait 30 seconds for the server to fully start');
    console.log('2. Hard refresh the browser (Ctrl+F5)');
    console.log('3. Clear browser cache');

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      frontendProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Manual steps:');
    console.log('1. Close all terminal windows');
    console.log('2. Delete frontend/node_modules/.cache');
    console.log('3. Delete frontend/.eslintcache');
    console.log('4. Run: cd frontend && npm start');
  }
}

fixAdminError();
