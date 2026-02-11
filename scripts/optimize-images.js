import sharp from 'sharp';
import { readdir, stat, rename } from 'fs/promises';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;
const PNG_QUALITY = 82; // for palette-based quantization
const PNG_COMPRESSION = 9;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

async function getImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getImages(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const { size: originalSize } = await stat(filePath);

  const tmpPath = filePath + '.tmp';

  let pipeline = sharp(filePath).resize({
    width: MAX_WIDTH,
    height: MAX_WIDTH,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  } else if (ext === '.png') {
    pipeline = pipeline.png({
      quality: PNG_QUALITY,
      compressionLevel: PNG_COMPRESSION,
      palette: true,
    });
  }

  await pipeline.toFile(tmpPath);

  const { size: newSize } = await stat(tmpPath);

  // Only keep the optimized version if it's actually smaller
  if (newSize < originalSize) {
    await rename(tmpPath, filePath);
    const saved = ((1 - newSize / originalSize) * 100).toFixed(1);
    const origMB = (originalSize / 1024 / 1024).toFixed(2);
    const newMB = (newSize / 1024 / 1024).toFixed(2);
    console.log(`  ${path.relative(PUBLIC_DIR, filePath)}: ${origMB}MB -> ${newMB}MB (-${saved}%)`);
    return { original: originalSize, optimized: newSize };
  } else {
    const { unlink } = await import('fs/promises');
    await unlink(tmpPath);
    console.log(`  ${path.relative(PUBLIC_DIR, filePath)}: skipped (already optimal)`);
    return { original: originalSize, optimized: originalSize };
  }
}

async function main() {
  console.log('\n🖼️  Image optimization started...\n');

  const images = await getImages(PUBLIC_DIR);
  if (images.length === 0) {
    console.log('No images found.');
    return;
  }

  console.log(`Found ${images.length} images to process:\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const img of images) {
    try {
      const result = await optimizeImage(img);
      totalOriginal += result.original;
      totalOptimized += result.optimized;
    } catch (err) {
      console.error(`  WARN: ${path.relative(PUBLIC_DIR, img)}: ${err.message}`);
    }
  }

  const totalSavedMB = ((totalOriginal - totalOptimized) / 1024 / 1024).toFixed(2);
  const totalSavedPct = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);

  console.log(`\n  Total: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB -> ${(totalOptimized / 1024 / 1024).toFixed(2)}MB (-${totalSavedMB}MB, -${totalSavedPct}%)\n`);
}

main();
