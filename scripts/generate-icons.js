import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function createPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT raw scanlines
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter type byte
    for (let x = 0; x < width; x++) {
      // Draw green square with rounded margins / white border accent
      const margin = Math.floor(width * 0.08);
      const isInner = (x >= margin && x < width - margin && y >= margin && y < height - margin);
      const isCenterSquare = (x >= width*0.35 && x <= width*0.65 && y >= height*0.35 && y <= height*0.65);
      
      if (isCenterSquare) {
        rawData.push(255, 255, 255); // White logo emblem
      } else if (isInner) {
        rawData.push(r, g, b); // Emerald green #16a34a (22, 163, 74)
      } else {
        rawData.push(22, 163, 74); // Outer bg
      }
    }
  }

  const compressedData = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);
  
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return ~c;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA PNG Icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, 22, 163, 74));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, 22, 163, 74));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 22, 163, 74));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, 22, 163, 74));
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), createPNG(32, 32, 22, 163, 74));

console.log('Icons generated successfully!');
