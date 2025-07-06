#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Render build process...');

// Print environment info
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

function runCommand(command, cwd = process.cwd()) {
  console.log(`Running: ${command} in ${cwd}`);
  try {
    const result = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env }
    });
    return result;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error('Error:', error.message);
    process.exit(1);
  }
}

function checkExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  if (!exists) {
    console.error(`Missing: ${description}`);
    if (fs.existsSync(path.dirname(filePath))) {
      console.log(`Parent directory contents:`, fs.readdirSync(path.dirname(filePath)));
    }
    process.exit(1);
  }
  return exists;
}

// Check directory structure
console.log('\n📁 Checking directory structure...');
console.log('Root directory contents:', fs.readdirSync('.'));

const clientDir = path.join(process.cwd(), 'client');
checkExists(clientDir, 'Client directory');

console.log('Client directory contents:', fs.readdirSync(clientDir));

// Install root dependencies
console.log('\n📦 Installing root dependencies...');
runCommand('npm install');

// Install client dependencies
console.log('\n📦 Installing client dependencies...');
runCommand('npm install', clientDir);

// Build React app
console.log('\n🔨 Building React application...');
runCommand('npm run build', clientDir);

// Verify build
console.log('\n🔍 Verifying build...');
const buildDir = path.join(clientDir, 'build');
const indexFile = path.join(buildDir, 'index.html');

checkExists(buildDir, 'Build directory');
checkExists(indexFile, 'index.html file');

// Check build contents
const buildContents = fs.readdirSync(buildDir);
console.log('Build directory contents:', buildContents);

const indexStats = fs.statSync(indexFile);
console.log(`index.html size: ${indexStats.size} bytes`);

if (indexStats.size < 100) {
  console.error('❌ index.html seems too small, build may be incomplete');
  process.exit(1);
}

// Check for static files
const staticDir = path.join(buildDir, 'static');
if (fs.existsSync(staticDir)) {
  console.log('✅ Static directory found');
  const staticContents = fs.readdirSync(staticDir);
  console.log('Static directory contents:', staticContents);
} else {
  console.warn('⚠️ Static directory not found');
}

console.log('\n🎉 Build completed successfully!');
console.log('Build summary:');
console.log(`- Build directory: ${buildDir}`);
console.log(`- Index file: ${indexFile}`);
console.log(`- Index size: ${indexStats.size} bytes`);
console.log('- Ready for deployment ✨');