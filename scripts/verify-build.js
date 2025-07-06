#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build process...');

const projectRoot = path.join(__dirname, '..');
const clientDir = path.join(projectRoot, 'client');
const buildDir = path.join(clientDir, 'build');
const indexFile = path.join(buildDir, 'index.html');

console.log('Project root:', projectRoot);
console.log('Client directory:', clientDir);
console.log('Build directory:', buildDir);

// Check if client directory exists
if (!fs.existsSync(clientDir)) {
  console.error('❌ Client directory not found!');
  console.log('Expected location:', clientDir);
  process.exit(1);
}

console.log('✅ Client directory found');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found!');
  console.log('Expected location:', buildDir);
  console.log('Client directory contents:');
  fs.readdirSync(clientDir).forEach(file => {
    console.log('  -', file);
  });
  process.exit(1);
}

console.log('✅ Build directory found');

// Check if index.html exists
if (!fs.existsSync(indexFile)) {
  console.error('❌ index.html not found in build directory!');
  console.log('Expected location:', indexFile);
  console.log('Build directory contents:');
  fs.readdirSync(buildDir).forEach(file => {
    console.log('  -', file);
  });
  process.exit(1);
}

console.log('✅ index.html found');

// Check if static directory exists (should contain JS and CSS files)
const staticDir = path.join(buildDir, 'static');
if (!fs.existsSync(staticDir)) {
  console.warn('⚠️  Static directory not found - this might indicate an incomplete build');
} else {
  console.log('✅ Static directory found');
  
  // Check for JS files
  const jsDir = path.join(staticDir, 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    console.log(`✅ Found ${jsFiles.length} JavaScript files`);
  }
  
  // Check for CSS files
  const cssDir = path.join(staticDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    console.log(`✅ Found ${cssFiles.length} CSS files`);
  }
}

// Get file size of index.html
const indexStats = fs.statSync(indexFile);
console.log(`✅ index.html size: ${indexStats.size} bytes`);

if (indexStats.size < 100) {
  console.warn('⚠️  index.html seems very small - this might indicate an incomplete build');
}

console.log('🎉 Build verification completed successfully!');
console.log('');
console.log('Build summary:');
console.log('- Build directory:', buildDir);
console.log('- index.html size:', indexStats.size, 'bytes');
console.log('- Ready for deployment');