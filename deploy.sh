#!/bin/bash

# QRT Closure Platform - Deployment Script
# This script handles deployment with build optimization and error recovery

echo "🚀 Starting QRT Closure Platform deployment..."

# Set environment variables
export NODE_ENV=production
export VITE_NODE_ENV=production

# Clean previous builds and cache
echo "🧹 Cleaning previous builds and cache..."
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf client/node_modules/.vite/

# Clear npm cache to avoid pre-transform errors
echo "🔄 Clearing npm cache..."
npm cache clean --force

# Rebuild node_modules to ensure clean dependencies
echo "📦 Reinstalling dependencies..."
npm install --no-audit --no-fund

# Build the application with optimizations and error handling
echo "📦 Building application..."
timeout 300 npm run build 2>&1 | tee build.log

# Check if build was successful
if [ $? -eq 0 ] && [ -f "dist/index.js" ]; then
    echo "✅ Build completed successfully!"
    echo "📊 Build stats:"
    ls -lh dist/
    if [ -d "dist/public" ]; then
        echo "📁 Client assets:"
        ls -lh dist/public/
    fi
    
    # Start the production server
    echo "🌟 Starting production server..."
    cd dist && node index.js
else
    echo "❌ Build failed! Checking error logs..."
    if [ -f "build.log" ]; then
        echo "📋 Build errors:"
        tail -20 build.log
    fi
    
    echo "🔄 Attempting fallback build with development mode..."
    NODE_ENV=development npm run dev
fi