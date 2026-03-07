const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

function drawIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#4F46E5');
  grad.addColorStop(1, '#7C3AED');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.22);
  ctx.fill();

  // House emoji text
  ctx.font = `${size * 0.52}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏠', size / 2, size / 2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(assetsDir, filename), buffer);
  console.log(`✅ Created ${filename} (${size}x${size})`);
}

function drawSplash() {
  const w = 1284, h = 2778;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#4F46E5');
  grad.addColorStop(1, '#7C3AED');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.font = `${w * 0.25}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏠', w / 2, h / 2 - 60);

  ctx.fillStyle = 'white';
  ctx.font = `bold ${w * 0.09}px sans-serif`;
  ctx.fillText('HomeMaid', w / 2, h / 2 + 80);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(assetsDir, 'splash.png'), buffer);
  console.log('✅ Created splash.png');
}

try {
  drawIcon(1024, 'icon.png');
  drawIcon(1024, 'adaptive-icon.png');
  drawIcon(32, 'favicon.png');
  drawSplash();
  console.log('\n🎉 All assets generated in ./assets/');
} catch (err) {
  console.error('canvas package not available, creating simple placeholder files...');
  // Fallback: copy from a URL or just create empty placeholder
  ['icon.png', 'adaptive-icon.png', 'splash.png', 'favicon.png'].forEach(f => {
    if (!fs.existsSync(path.join(assetsDir, f))) {
      fs.writeFileSync(path.join(assetsDir, f), '');
      console.log(`Created empty placeholder: ${f}`);
    }
  });
}
