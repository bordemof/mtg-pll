#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting Render build process..."

# Print environment info
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# List contents to debug
echo "Root directory contents:"
ls -la

# Install root dependencies first
echo "📦 Installing root dependencies..."
npm install

# Check if client directory exists
if [ ! -d "client" ]; then
    echo "❌ Client directory not found!"
    echo "Contents of current directory:"
    ls -la
    exit 1
fi

echo "✅ Client directory found"

# Navigate to client and install dependencies
echo "📦 Installing client dependencies..."
cd client

echo "Client directory contents:"
ls -la

# Install client dependencies
npm install

# Build the React app
echo "🔨 Building React application..."
npm run build

# Verify build was successful
if [ ! -d "build" ]; then
    echo "❌ Build directory not created!"
    echo "Client directory contents after build:"
    ls -la
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "❌ index.html not found in build directory!"
    echo "Build directory contents:"
    ls -la build/
    exit 1
fi

echo "✅ Build verification successful!"
echo "Build directory contents:"
ls -la build/

echo "index.html size: $(wc -c < build/index.html) bytes"

cd ..
echo "🎉 Render build completed successfully!"