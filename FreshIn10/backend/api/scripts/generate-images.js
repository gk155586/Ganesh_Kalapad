const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const imagesDir = path.join(publicDir, 'images');
const fruitsDir = path.join(imagesDir, 'fruits');
const vegetablesDir = path.join(imagesDir, 'vegetables');

// Ensure directories exist
[publicDir, imagesDir, fruitsDir, vegetablesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const generateSVG = (type, index, color1, color2) => {
  return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad${index})" />
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
    ${type} ${index}
  </text>
  <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">
    FreshIn10 Local Image
  </text>
</svg>`;
};

console.log("Generating 1000 fruit images...");
for (let i = 1; i <= 1000; i++) {
  const svg = generateSVG('Fruit', i, '#ff7e5f', '#feb47b'); // Peachy gradient
  fs.writeFileSync(path.join(fruitsDir, `fruit_${i}.svg`), svg);
}

console.log("Generating 1000 vegetable images...");
for (let i = 1; i <= 1000; i++) {
  const svg = generateSVG('Vegetable', i, '#56ab2f', '#a8e063'); // Green gradient
  fs.writeFileSync(path.join(vegetablesDir, `vegetable_${i}.svg`), svg);
}

console.log("Successfully generated 2000 local images in the public folder!");
