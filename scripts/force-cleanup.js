#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const os = require('os');

const lockPath = path.join(process.cwd(), '.next/dev/lock');
const nextDir = path.join(process.cwd(), '.next/dev');

try {
  // Kill existing node processes (Windows-specific)
  if (os.platform() === 'win32') {
    try {
      execSync('taskkill /f /im node.exe /fi "WINDOWTITLE eq *next*"', { 
        stdio: 'ignore',
        shell: true 
      });
      console.log('✓ Terminated existing dev processes');
    } catch (e) {
      // Process might not exist, that's fine
    }
  } else {
    // For macOS/Linux
    try {
      execSync("pkill -f 'next dev' || true", { stdio: 'ignore' });
      console.log('✓ Terminated existing dev processes');
    } catch (e) {
      // Process might not exist, that's fine
    }
  }

  // Wait a moment for processes to die
  execSync('timeout /t 1 /nobreak', { stdio: 'ignore', shell: true }).catch(() => {});

  // Remove the lock file and .next directory
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.log('✓ Cleaned up stale lock file');
  }

  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✓ Cleaned up .next/dev directory');
  }

  // Recreate .next/dev directory
  fs.mkdirSync(nextDir, { recursive: true });
} catch (error) {
  console.warn('⚠ Cleanup warning:', error.message);
  // Continue anyway - the dev server might still work
}
