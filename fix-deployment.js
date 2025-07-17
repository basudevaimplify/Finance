#!/usr/bin/env node

/**
 * Deployment Fix Script for QRT Closure Platform
 * Addresses specific Vite pre-transform errors seen in deployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function cleanBuildCache() {
  console.log('🧹 Cleaning build cache...');
  
  const cachePaths = [
    'dist',
    'node_modules/.vite',
    'client/node_modules/.vite',
    '.vite',
    'client/.vite'
  ];
  
  for (const cachePath of cachePaths) {
    try {
      await fs.rm(cachePath, { recursive: true, force: true });
      console.log(`✅ Removed ${cachePath}`);
    } catch (error) {
      // Ignore errors if path doesn't exist
    }
  }
}

async function fixMainTsx() {
  console.log('🔧 Fixing main.tsx import paths...');
  
  const mainTsxPath = 'client/src/main.tsx';
  try {
    const content = await fs.readFile(mainTsxPath, 'utf8');
    
    // Ensure clean import paths
    const fixedContent = content
      .replace(/from\s+["']\.\/App["']/g, 'from "./App.tsx"')
      .replace(/from\s+["']\.\/index\.css["']/g, 'from "./index.css"');
    
    await fs.writeFile(mainTsxPath, fixedContent);
    console.log('✅ Fixed main.tsx imports');
  } catch (error) {
    console.log('⚠️  Could not fix main.tsx:', error.message);
  }
}

async function optimizedBuild() {
  console.log('📦 Running optimized build...');
  
  try {
    // Set environment variables
    process.env.NODE_ENV = 'production';
    process.env.VITE_NODE_ENV = 'production';
    
    // Run build with timeout
    const { stdout, stderr } = await execAsync('npm run build', { 
      timeout: 300000, // 5 minutes
      env: { ...process.env }
    });
    
    console.log('Build output:', stdout);
    if (stderr) console.log('Build warnings:', stderr);
    
    // Check if build artifacts exist
    const distExists = await fs.access('dist/index.js').then(() => true).catch(() => false);
    const publicExists = await fs.access('dist/public').then(() => true).catch(() => false);
    
    if (distExists && publicExists) {
      console.log('✅ Build completed successfully!');
      return true;
    } else {
      console.log('❌ Build artifacts missing');
      return false;
    }
  } catch (error) {
    console.log('❌ Build failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting deployment fix...');
  
  try {
    await cleanBuildCache();
    await fixMainTsx();
    
    const buildSuccess = await optimizedBuild();
    
    if (buildSuccess) {
      console.log('🎉 Deployment fix completed successfully!');
      console.log('✅ Ready to start production server');
      process.exit(0);
    } else {
      console.log('❌ Deployment fix failed');
      console.log('🔄 Recommend using development mode');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Deployment fix encountered error:', error);
    process.exit(1);
  }
}

main();