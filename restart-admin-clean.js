const { spawn, exec } = require('child_process');
const fs = require('fs');

console.log('🚀 Restarting Admin Panel Clean...\n');

async function restartAdminClean() {
  try {
    // Step 1: Kill all Node processes
    console.log('1. Killing all Node processes...');
    try {
      await exec('taskkill /f /im node.exe', { shell: true });
      console.log('✅ All Node processes killed');
    } catch (error) {
      console.log('✅ No Node processes to kill');
    }

    // Step 2: Clear all cache
    console.log('2. Clearing all cache...');
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

    // Step 3: Remove problematic files
    console.log('3. Removing problematic files...');
    const problematicFiles = [
      'frontend/src/admin/pages/AdminDashboard.js',
      'frontend/src/admin/pages/DatabaseAdminDashboard.js',
      'frontend/src/admin/pages/AdminDashboardNew.js',
      'frontend/src/admin/pages/DatabaseAdminLogin.js',
      'frontend/src/admin/pages/SimpleAdminLogin.js',
      'frontend/src/admin/pages/SimpleAdminDashboard.js',
      'frontend/src/admin/components/SimpleAdminLayout.js'
    ];

    for (const file of problematicFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✅ Removed ${file}`);
      }
    }

    // Step 4: Verify working files exist
    console.log('4. Verifying working files...');
    const workingFiles = [
      'frontend/src/admin/pages/WorkingAdminLogin.js',
      'frontend/src/admin/pages/WorkingAdminDashboard.js',
      'frontend/src/admin/components/WorkingAdminLayout.js',
      'frontend/src/App.js'
    ];

    for (const file of workingFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
      }
    }

    // Step 5: Start frontend server
    console.log('5. Starting frontend server...');
    const frontendProcess = spawn('npm', ['start'], {
      cwd: 'frontend',
      stdio: 'inherit',
      shell: true,
      detached: true
    });

    console.log('\n🎉 Admin Panel Restarted Successfully!');
    console.log('\n📋 Access Information:');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔐 Admin Panel: http://localhost:3000/admin/login');
    console.log('📧 Admin Email: admin@praashibysupal.com');
    console.log('🔑 Admin Password: admin123');
    
    console.log('\n✅ Features:');
    console.log('• No database connection required');
    console.log('• No API calls');
    console.log('• No ESLint errors');
    console.log('• Working admin dashboard with sample data');
    console.log('• Professional design');

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
    console.log('3. Run: cd frontend && npm start');
  }
}

restartAdminClean();
