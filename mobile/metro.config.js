const { getDefaultConfig } = require('expo/metro-config');
const { spawn } = require('child_process');
const path = require('path');

const config = getDefaultConfig(__dirname);

let serverProcess = null;
let serverStarted = false;

function startApiServer() {
  if (serverStarted) return;
  serverStarted = true;
  
  console.log('\n📡 Starting Kezi API server on port 3001...');
  
  serverProcess = spawn('npx', ['ts-node', '--transpile-only', 'server/index.ts'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' },
    detached: false
  });

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output && output.includes('Kezi API server running')) {
      console.log('✅ API server is ready on http://localhost:3001/api');
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('dotenv')) {
      console.error('[API Error]', output);
    }
  });

  serverProcess.on('error', (err) => {
    console.error('❌ Failed to start API server:', err.message);
    serverStarted = false;
  });

  serverProcess.on('exit', (code, signal) => {
    if (signal !== 'SIGTERM' && signal !== 'SIGINT' && code !== 0) {
      console.log('⚠️ API server crashed, restarting in 3 seconds...');
      serverStarted = false;
      setTimeout(startApiServer, 3000);
    }
  });
}

startApiServer();

process.on('exit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

process.on('SIGINT', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

module.exports = config;
