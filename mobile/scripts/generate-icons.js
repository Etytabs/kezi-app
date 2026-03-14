const sharp = require("sharp");
const path = require("path");

const input = path.join(__dirname, "../assets/images/icon.png");
const output = path.join(__dirname, "../assets");

const icons = [
  { name: "icon.png", size: 1024 },
  { name: "adaptive-icon.png", size: 1024 },
  { name: "favicon.png", size: 48 },
  { name: "splash.png", size: 2048 },
  { name: "android-icon-192.png", size: 192 },
  { name: "android-icon-512.png", size: 512 },
  { name: "ios-icon-180.png", size: 180 }
];

async function generate() {
  for (const icon of icons) {
    await sharp(input)
      .resize(icon.size, icon.size)
      .png()
      .toFile(`${output}/${icon.name}`);

    console.log(`Generated ${icon.name}`);
  }
}

generate();