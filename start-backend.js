const { spawn } = require('child_process');
const path = require('path');

// Load environment variables from env.local
require('dotenv').config({ path: './env.local' });

console.log('Starting backend server...');
console.log('Environment variables loaded from env.local');

// Set environment variables
const env = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'praashibysupal_db',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_development_only',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@praashibysupal.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123'
};

console.log('Database config:', {
  host: env.DB_HOST,
  user: env.DB_USER,
  database: env.DB_NAME,
  port: env.PORT
});

// Start the server
const server = spawn('node', ['server.js'], {
  env: env,
  stdio: 'inherit',
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.kill('SIGTERM');
  process.exit(0);
});
