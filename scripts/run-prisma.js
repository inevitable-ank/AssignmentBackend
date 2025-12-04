#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the project root directory
const projectRoot = path.join(__dirname, '..');

// Find Prisma CLI using require.resolve (most reliable)
let prismaPath;
try {
  // This is the most reliable way to find Prisma
  const prismaPackagePath = require.resolve('prisma/package.json');
  prismaPath = path.join(path.dirname(prismaPackagePath), 'build', 'index.js');
  
  // Verify the file exists
  if (!fs.existsSync(prismaPath)) {
    throw new Error('Prisma CLI not found');
  }
} catch (e) {
  // Fallback: try direct path
  prismaPath = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
  
  if (!fs.existsSync(prismaPath)) {
    console.error('Error: Could not find Prisma CLI');
    console.error('Tried:', prismaPath);
    process.exit(1);
  }
}

// Get command and arguments
const [, , command, ...args] = process.argv;

if (!command) {
  console.error('Usage: node run-prisma.js <command> [args...]');
  process.exit(1);
}

// Run Prisma CLI using node directly (bypasses binary permission issues)
// This works because node always has execute permissions
const prisma = spawn('node', [prismaPath, command, ...args], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: process.env,
  shell: false,
});

prisma.on('close', (code) => {
  process.exit(code || 0);
});

prisma.on('error', (err) => {
  console.error('Failed to start Prisma:', err.message);
  process.exit(1);
});

