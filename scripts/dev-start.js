#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Kezi Development Environment...');
console.log('');

let serverProcess = null;

function startApiServer() {
  console.log('📡 Starting API server on port 3001...');
  
  serverProcess = spawn('npx', ['ts-node', '--transpile-only', 'server/index.ts'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        console.log(`[API] ${line}`);
      });
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        console.error(`[API] ${line}`);
      });
    }
  });

  serverProcess.on('error', (err) => {
    console.error('[API] Failed to start:', err.message);
  });

  serverProcess.on('exit', (code, signal) => {
    if (signal !== 'SIGTERM' && signal !== 'SIGINT') {
      console.log(`[API] Server exited with code ${code}. Restarting in 3 seconds...`);
      setTimeout(startApiServer, 3000);
    }
  });
}

function startExpo() {
  console.log('📱 Starting Expo Metro bundler...');
  console.log('');
  
  const expoProcess = spawn('npx', ['expo', 'start'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_PACKAGER_PROXY_URL: `https://${process.env.REPLIT_DEV_DOMAIN}`,
      REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN
    }
  });

  expoProcess.on('error', (err) => {
    console.error('Failed to start Expo:', err.message);
    process.exit(1);
  });

  expoProcess.on('exit', (code) => {
    console.log(`Expo exited with code ${code}`);
    if (serverProcess) {
      serverProcess.kill();
    }
    process.exit(code);
  });
}

startApiServer();

setTimeout(() => {
  console.log('');
  console.log('✅ API server should be ready');
  console.log('');
  startExpo();
}, 6000);

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (serverProcess) serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  if (serverProcess) serverProcess.kill();
  process.exit(0);
});
