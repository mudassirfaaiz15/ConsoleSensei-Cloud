#!/usr/bin/env node
/**
 * ConsoleSensei Cloud - Complete Application Launcher
 * Starts both backend API and frontend dev server
 * Usage: node start-app.js
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';

console.log(`
================================================================================
  🚀 ConsoleSensei Cloud - AWS Resource Dashboard
================================================================================

Starting integrated application...
`);

// Backend process
const backendPath = path.join(__dirname, 'backend');
const backendCmd = isWindows ? 'python.exe' : 'python';
const backendArgs = ['api.py'];

console.log('📦 Starting Backend API (Port 5000)...');
const backend = spawn(backendCmd, backendArgs, {
  cwd: backendPath,
  stdio: 'inherit',
  shell: isWindows,
});

// Wait a moment for backend to start
setTimeout(() => {
  // Frontend process
  console.log('\n📱 Starting Frontend Dev Server (Port 5173)...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: isWindows,
  });

  // Handle process termination
  const cleanup = () => {
    console.log('\n\n🛑 Stopping services...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Display URLs
  setTimeout(() => {
    console.log(`
================================================================================
  ✅ ConsoleSensei Cloud is Ready!
================================================================================

  Backend API:    http://localhost:5000
  Frontend:       http://localhost:5173
  Dashboard:      http://localhost:5173/app/aws-resources

  📚 Documentation:
     - Full Guide: INTEGRATION_COMPLETE.md
     - Quick Start: AWS_DASHBOARD_README.md

  💡 To use the dashboard:
     1. Open http://localhost:5173/app/aws-resources
     2. Enter AWS credentials
     3. Click "Scan AWS Resources"
     4. Manage your resources!

================================================================================
  Press Ctrl+C to stop both services
================================================================================
`);
  }, 3000);
}, 1500);

// Handle backend errors
backend.on('error', (err) => {
  console.error('❌ Backend failed to start:', err.message);
  process.exit(1);
});

backend.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend exited with code ${code}`);
  }
});
