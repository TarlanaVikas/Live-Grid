#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const lockPath = path.join(process.cwd(), '.next/dev/lock');
const nextDir = path.join(process.cwd(), '.next/dev');

try {
  // Remove the lock file if it exists
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.log('✓ Cleaned up stale lock file');
  }

  // Ensure .next/dev directory exists
  if (!fs.existsSync(nextDir)) {
    fs.mkdirSync(nextDir, { recursive: true });
  }
} catch (error) {
  console.warn('⚠ Could not clean lock file:', error.message);
  // Continue anyway - the dev server might still work
}
