# Prisma + Render Deployment Guide

## Problem: Permission Denied Error

When deploying Prisma applications to Render's free tier, you may encounter:
```
sh: 1: prisma: Permission denied
```

This happens because:
1. Render's free tier doesn't support pre-deploy commands
2. Prisma binary lacks execute permissions
3. `npx prisma` fails due to permission issues

## Solution: Node.js Wrapper Script

### Step 1: Create Wrapper Script

Create `backend/scripts/run-prisma.js`:

```javascript
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
```

### Step 2: Update package.json Scripts

```json
{
  "scripts": {
    "build": "node scripts/run-prisma.js generate && tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "start:migrate": "node scripts/run-prisma.js migrate deploy && node dist/server.js",
    "prisma:generate": "node scripts/run-prisma.js generate",
    "prisma:migrate:deploy": "node scripts/run-prisma.js migrate deploy"
  }
}
```

### Step 3: Configure Prisma Schema for Multi-Platform

In `prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

**Why?** 
- `native` = your local development platform (Windows/Mac/Linux)
- `debian-openssl-3.0.x` = Render's Linux environment

### Step 4: Configure Render

#### Option A: Using render.yaml (Infrastructure as Code)

```yaml
services:
  - type: web
    name: your-backend
    env: node
    buildCommand: npm install --production=false && npm run build
    startCommand: npm run start:migrate
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: NODE_ENV
        value: production
```

#### Option B: Using Render Dashboard

1. **Build Command**: `npm install --production=false && npm run build`
2. **Start Command**: `npm run start:migrate`
3. **Pre-Deploy Command**: Leave empty (not available on free tier)

### Step 5: Environment Variables

Set these in Render Dashboard:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV=production`
- `JWT_SECRET` - Your JWT secret key
- `CORS_ORIGIN` - Your frontend URL
- `PORT=4000` (optional, defaults to 4000)

## Why This Works

1. **Wrapper Script**: Uses Node.js to execute Prisma CLI, bypassing binary permission issues
2. **Build Phase**: Runs `prisma generate` during build on Render (Linux), generating correct binaries
3. **Start Phase**: Runs migrations before starting server (free tier compatible)
4. **Binary Targets**: Includes both local and Render platforms

## Common Issues & Solutions

### Issue: "Prisma Client could not locate the Query Engine"

**Solution**: Ensure `binaryTargets` includes `"debian-openssl-3.0.x"` and `prisma generate` runs during build on Render.

### Issue: Migrations not running

**Solution**: Use `start:migrate` script that runs `prisma migrate deploy` before starting server.

### Issue: Build succeeds but runtime fails

**Solution**: Make sure `prisma generate` is in the build script, not just locally.

## Quick Checklist

- [ ] Wrapper script created at `scripts/run-prisma.js`
- [ ] `package.json` scripts use wrapper (`node scripts/run-prisma.js`)
- [ ] `schema.prisma` has `binaryTargets = ["native", "debian-openssl-3.0.x"]`
- [ ] Build command includes `npm run build` (which runs prisma generate)
- [ ] Start command uses `npm run start:migrate`
- [ ] All environment variables set in Render dashboard
- [ ] Prisma is in `dependencies` (not `devDependencies`)

## Testing Locally

```bash
# Test the wrapper script
node scripts/run-prisma.js generate
node scripts/run-prisma.js migrate deploy

# Test build
npm run build

# Test start with migrations
npm run start:migrate
```

## Deployment Flow

1. **Build Phase**:
   - `npm install` → Installs dependencies
   - `npm run build` → Runs `node scripts/run-prisma.js generate` (generates Prisma Client for Linux) → Compiles TypeScript

2. **Start Phase**:
   - `npm run start:migrate` → Runs `node scripts/run-prisma.js migrate deploy` (applies migrations) → Starts server

## Notes

- This solution works on Render's **free tier** (no pre-deploy commands needed)
- The wrapper script is a proven workaround for Prisma permission issues
- Always test locally before deploying
- Keep `prisma` in `dependencies`, not `devDependencies`

