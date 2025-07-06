#!/usr/bin/env node

// This script can be run locally before committing to ensure the build exists

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Pre-deployment build script');

const clientDir = path.join(__dirname, '..', 'client');
const buildDir = path.join(clientDir, 'build');

console.log('Client directory:', clientDir);
console.log('Build directory:', buildDir);

// Remove existing build
if (fs.existsSync(buildDir)) {
  console.log('🗑️ Removing existing build...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}

try {
  console.log('📦 Installing client dependencies...');
  execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
  
  console.log('🔨 Building React app...');
  execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
  
  if (fs.existsSync(buildDir)) {
    console.log('✅ Build successful!');
    console.log('Build contents:', fs.readdirSync(buildDir));
    
    // Check if it should be committed
    console.log('\n⚠️ IMPORTANT:');
    console.log('The build directory is usually excluded from git.');
    console.log('For deployment issues, you might temporarily commit the build directory:');
    console.log('1. Remove "client/build/" from .gitignore');
    console.log('2. git add client/build/');
    console.log('3. git commit -m "Add pre-built client for deployment"');
    console.log('4. Deploy to Render');
    console.log('5. Restore .gitignore after successful deployment');
    
  } else {
    console.error('❌ Build failed!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Build error:', error.message);
  process.exit(1);
}