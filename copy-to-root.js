#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const rootDir = __dirname;

console.log('Copying build files from dist to root...');

// Function to recursively copy directory
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory not found. Please run the build first.');
  process.exit(1);
}

// Read all files from dist directory
const files = fs.readdirSync(distDir, { withFileTypes: true });
let copiedCount = 0;

files.forEach(entry => {
  const srcPath = path.join(distDir, entry.name);
  const destPath = path.join(rootDir, entry.name);

  try {
    if (entry.isDirectory()) {
      // Copy directory recursively
      copyDir(srcPath, destPath);
      console.log(`Copied directory: ${entry.name}`);
    } else {
      // Copy file to root
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${entry.name}`);
    }
    copiedCount++;
  } catch (err) {
    console.error(`Error copying ${entry.name}:`, err.message);
  }
});

console.log(`\nSuccessfully copied ${copiedCount} item(s) to root directory.`);
