const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;
process.env.NODE_ENV = 'production';

console.log('Starting Kezi in production mode...');

const staticBuildPath = path.join(__dirname, '..', 'static-build');
if (!fs.existsSync(staticBuildPath)) {
  fs.mkdirSync(staticBuildPath, { recursive: true });
}

const landingPageContent = `<!DOCTYPE html>
<html>
  <head>
    <title>Kezi - Cycle Tracking & Wellness</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        text-align: center;
        background: linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 50%, #FAE8FF 100%);
        min-height: 100vh;
      }
      .header { margin-bottom: 20px; }
      .app-name {
        font-size: 28px;
        font-weight: bold;
        background: linear-gradient(135deg, #EC4899, #9333EA);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
      }
      .tagline { color: #6B7280; font-size: 14px; margin-top: 5px; }
      .card {
        background: white;
        border-radius: 20px;
        padding: 25px;
        margin: 20px 0;
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.1);
      }
      .store-buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 15px;
      }
      .store-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 600;
        border: none;
        border-radius: 10px;
        text-decoration: none;
        color: white;
        transition: transform 0.2s;
      }
      .store-button:hover { transform: translateY(-2px); }
      .store-button.ios { background: #000; }
      .store-button.android { background: #3DDC84; color: #000; }
      .note { font-size: 14px; color: #6B7280; margin-top: 20px; }
      .status { color: #10B981; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="app-name">Kezi</div>
      <div class="tagline">Cycle Tracking & Wellness</div>
    </div>
    <div class="card">
      <h3 style="margin: 0 0 15px 0; color: #374151;">Get the App</h3>
      <p style="color: #6B7280; font-size: 14px; margin-bottom: 15px;">Download Expo Go to run Kezi on your phone</p>
      <div class="store-buttons">
        <a href="https://apps.apple.com/app/id982107779" class="store-button ios" target="_blank">App Store</a>
        <a href="https://play.google.com/store/apps/details?id=host.exp.exponent" class="store-button android" target="_blank">Google Play</a>
      </div>
    </div>
    <div class="note">
      <span class="status">API Running</span> - Use Expo Go to connect to the app
    </div>
  </body>
</html>`;

fs.writeFileSync(path.join(staticBuildPath, 'index.html'), landingPageContent);

const { spawn } = require('child_process');

console.log('Starting server on port ' + PORT + '...');

const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production', PORT: PORT.toString() }
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});
