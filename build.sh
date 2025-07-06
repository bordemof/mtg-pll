#!/bin/bash

echo "🚀 Building Magic Poll for deployment..."

# Install root dependencies
echo "📦 Installing server dependencies..."
npm install

# Install client dependencies and build
echo "📦 Installing client dependencies..."
cd client
npm install

echo "🔨 Building React application..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Built files are in client/build/"
    ls -la build/
else
    echo "❌ Build failed!"
    exit 1
fi

cd ..
echo "🎉 Ready for deployment!"