
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../../posts');
const PUBLIC_DIR = path.join(__dirname, '../../public');
const BASE_OUTPUT_DIR = path.join(PUBLIC_DIR, 'og');
const POSTS_OUTPUT_DIR = path.join(BASE_OUTPUT_DIR, 'posts');

// Ensure output directories exist
if (!fs.existsSync(POSTS_OUTPUT_DIR)) {
  fs.mkdirSync(POSTS_OUTPUT_DIR, { recursive: true });
}

async function getFont() {
  const fontPath = path.join(__dirname, 'Roboto-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    return fs.readFileSync(fontPath);
  } else {
    console.log('Fetching font...');
    const response = await fetch('https://raw.githubusercontent.com/openmaptiles/fonts/master/roboto/Roboto-Regular.ttf');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(fontPath, buffer);
    return buffer;
  }
}

async function generateOptimizedBanner(imagePath, outputPath, fontData) {
    console.log(`Optimizing banner for: ${path.basename(outputPath)}`);
    
    // Read image and convert to base64
    const fullImagePath = path.join(PUBLIC_DIR, imagePath);
    if (!fs.existsSync(fullImagePath)) {
        console.warn(`Warning: Image not found at ${fullImagePath}, skipping optimization.`);
        return;
    }
    const imageBuffer = fs.readFileSync(fullImagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const template = html`
      <div style="display: flex; height: 100%; width: 100%; align-items: center; justify-content: center; background-color: #000; overflow: hidden; position: relative;">
        <!-- Background Image with Zoom -->
         <img src="${dataUrl}" width="1200" height="630" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.1); transform-origin: center;" />
         
         <!-- Watermark Overlay -->
         <div style="position: absolute; bottom: 30px; right: 30px; display: flex; align-items: center; background-color: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
            <div style="background-color: #171717; border: 1px solid #404040; padding: 0 8px; border-radius: 4px; display: flex; align-items: center; justify-content: center; height: 32px; margin-right: 12px;">
                <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #ef4444; line-height: 1;">&gt;</span>
                <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: white; line-height: 1;">_</span>
            </div>
            <div style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: -1px;">
                <span style="color: white">DevOps</span>
                <span style="color: #ef4444">Zero</span>
                <span style="color: white">To</span>
                <span style="color: white">Hero</span>
            </div>
         </div>
      </div>
    `;

    const svg = await satori(template, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Roboto',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
    });

    const resvg = new Resvg(svg, {
      background: '#000',
      fitTo: {
        mode: 'width',
        value: 1200,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    fs.writeFileSync(outputPath, pngBuffer);
}

async function generateImage(title, date, outputPath, fontData) {
  console.log(`Generating OG for: ${title}`);

  const template = html`
    <div style="display: flex; height: 100%; width: 100%; align-items: center; justify-content: center; background-color: #09090b; color: white; font-family: 'Roboto', sans-serif;">
      <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 40px; border: 2px solid #3f3f46; border-radius: 12px; background-color: #18181b; width: 90%; height: 80%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        
        <!-- Navbar-style Logo -->
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="background-color: #171717; border: 1px solid #404040; padding: 0 8px; border-radius: 4px; display: flex; align-items: center; justify-content: center; height: 40px; margin-right: 12px;">
            <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #ef4444; line-height: 1;">&gt;</span>
            <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: white; line-height: 1;">_</span>
          </div>
          <div style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: -2px;">
            <span style="color: white">DevOps</span>
            <span style="color: #ef4444">Zero</span>
            <span style="color: white">To</span>
            <span style="color: white">Hero</span>
          </div>
        </div>

        <div style="font-size: 64px; font-weight: bold; line-height: 1.1; margin-bottom: 40px; background-image: linear-gradient(to right, #ffffff, #a1a1aa); background-clip: text; color: transparent;">
          ${title}
        </div>
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-end; margin-top: auto;">
           <div style="font-size: 24px; color: #71717a;">
              ${date}
           </div>
           <div style="display: flex; align-items: center;">
              <div style="width: 40px; height: 40px; background-color: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; color: black; font-weight: bold;">K</div>
              <div style="font-size: 24px; color: #e4e4e7;">Kompot</div>
           </div>
        </div>
      </div>
    </div>
  `;

  const svg = await satori(template, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Roboto',
        data: fontData,
        weight: 400,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, {
    background: '#09090b',
    fitTo: {
      mode: 'width',
      value: 1200,
      },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  fs.writeFileSync(outputPath, pngBuffer);
}

async function generate() {
  const fontData = await getFont();
  
  // 1. Generate for Posts
  const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    
    const title = data.title || 'Vibe DevOps';
    const date = data.date ? new Date(data.date).toLocaleDateString('pl-PL') : '';
    const slug = file.replace('.md', '');
    const outputPath = path.join(POSTS_OUTPUT_DIR, `${slug}.png`);

    if (data.imageUrl) {
        // Optimize existing banner
        await generateOptimizedBanner(data.imageUrl, outputPath, fontData);
    } else {
        // Generate text-based OG
        await generateImage(title, date, outputPath, fontData);
    }
  }

  // 2. Generate generic pages
  await generateImage('DevOps Adventure', 'Dokumentacja podróży w głąb infrastruktury', path.join(BASE_OUTPUT_DIR, 'home.png'), fontData);
  await generateImage('Roadmapa 2026', '', path.join(BASE_OUTPUT_DIR, 'roadmap.png'), fontData);
  
  console.log('OG Images generated successfully!');
}

generate().catch(console.error);
