const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

console.log('Creating placeholder asset files...');

// Create simple placeholder files
const files = ['icon.png', 'adaptive-icon.png', 'splash.png', 'favicon.png'];
files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    // Create a minimal 1x1 transparent PNG
    const minimalPNG = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk start
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xF4, // bit depth, color type, etc.
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk start
      0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00, // compressed data
      0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // more data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
      0xAE, 0x42, 0x60, 0x82 // IEND CRC
    ]);
    fs.writeFileSync(filePath, minimalPNG);
    console.log(`✅ Created ${file}`);
  } else {
    console.log(`⏭️  ${file} already exists`);
  }
});

console.log('\n🎉 Placeholder assets created!');
console.log('💡 For production builds, replace these with proper icons and splash screens.');
console.log('💡 You can use online tools like "expo-image-generator" or Figma to create them.');
