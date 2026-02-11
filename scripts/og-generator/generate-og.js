
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import matter from 'gray-matter';
import sharp from 'sharp';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_PNG_QUALITY = 80;

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
    
    // Pre-resize source image via sharp to save memory in satori
    const fullImagePath = path.join(PUBLIC_DIR, imagePath);
    if (!fs.existsSync(fullImagePath)) {
        console.warn(`Warning: Image not found at ${fullImagePath}, skipping optimization.`);
        return;
    }
    const resizedBuffer = await sharp(fullImagePath)
        .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
        .png()
        .toBuffer();
    const base64Image = resizedBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

      const svg = await satori(
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
              position: 'relative',
            },
            children: [
              // Background Image with proper scaling
              {
                type: 'img',
                props: {
                  src: dataUrl,
                  style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }
                }
              },
              // Content Overlay
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: '20px 40px',
                    borderRadius: 16,
                    border: '2px solid rgba(255,255,255,0.2)',
                    position: 'absolute',
                    bottom: 30,
                    right: 30,
                  },
                  children: [
                    // Icon
                    {
                      type: 'div',
                      props: {
                        style: {
                          backgroundColor: '#171717',
                          border: '2px solid #404040',
                          padding: '0 16px',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 64,
                          marginRight: 24,
                        },
                        children: [
                          { type: 'span', props: { style: { fontFamily: 'monospace', fontSize: 40, fontWeight: 'bold', color: '#ef4444', lineHeight: 1 }, children: '>' } },
                          { type: 'span', props: { style: { fontFamily: 'monospace', fontSize: 40, fontWeight: 'bold', color: 'white', lineHeight: 1 }, children: '_' } }
                        ]
                      }
                    },
                    // Text
                    {
                      type: 'div',
                      props: {
                        style: { fontFamily: 'monospace', fontSize: 48, fontWeight: 'bold', letterSpacing: '-2px', display: 'flex' },
                        children: [
                          { type: 'span', props: { style: { color: 'white' }, children: 'DevOps' } },
                          { type: 'span', props: { style: { color: '#ef4444' }, children: 'Zero' } },
                          { type: 'span', props: { style: { color: 'white' }, children: 'To' } },
                          { type: 'span', props: { style: { color: 'white' }, children: 'Hero' } },
                        ]
                      }
                    }
                  ]
                }
              }
            ],
          },
        },      {
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
      }
    );

    const resvg = new Resvg(svg, {
      background: '#000',
      fitTo: {
        mode: 'width',
        value: OG_WIDTH,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Compress final OG image via sharp
    const compressed = await sharp(pngBuffer)
        .resize(OG_WIDTH, OG_HEIGHT, { fit: 'fill' })
        .png({ quality: OG_PNG_QUALITY, compressionLevel: 9, palette: true })
        .toBuffer();

    fs.writeFileSync(outputPath, compressed);
    console.log(`  -> ${(pngBuffer.length / 1024).toFixed(0)}KB -> ${(compressed.length / 1024).toFixed(0)}KB`);
}

async function generateImage(title, date, outputPath, fontData) {
  console.log(`Generating OG for: ${title}`);

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: 'white',
          fontFamily: "'Roboto', sans-serif",
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: 40,
                border: '2px solid #3f3f46',
                borderRadius: 12,
                backgroundColor: '#18181b',
                width: '90%',
                height: '80%',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              },
              children: [
                // Navbar-style Logo
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', alignItems: 'center', marginBottom: 20 },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            backgroundColor: '#171717',
                            border: '1px solid #404040',
                            padding: '0 8px',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 40,
                            marginRight: 12,
                          },
                          children: [
                            { type: 'span', props: { style: { fontFamily: 'monospace', fontSize: 24, fontWeight: 'bold', color: '#ef4444', lineHeight: 1 }, children: '>' } },
                            { type: 'span', props: { style: { fontFamily: 'monospace', fontSize: 24, fontWeight: 'bold', color: 'white', lineHeight: 1 }, children: '_' } }
                          ]
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: { fontFamily: 'monospace', fontSize: 32, fontWeight: 'bold', letterSpacing: '-2px', display: 'flex' },
                          children: [
                            { type: 'span', props: { style: { color: 'white' }, children: 'DevOps' } },
                            { type: 'span', props: { style: { color: '#ef4444' }, children: 'Zero' } },
                            { type: 'span', props: { style: { color: 'white' }, children: 'To' } },
                            { type: 'span', props: { style: { color: 'white' }, children: 'Hero' } },
                          ]
                        }
                      }
                    ]
                  }
                },
                // Title
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 64,
                      fontWeight: 'bold',
                      lineHeight: 1.1,
                      marginBottom: 40,
                      backgroundImage: 'linear-gradient(to right, #ffffff, #a1a1aa)',
                      backgroundClip: 'text',
                      color: 'transparent',
                    },
                    children: title
                  }
                },
                // Footer (Date + Author)
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end', marginTop: 'auto' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: 24, color: '#71717a' },
                          children: date
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', alignItems: 'center' },
                          children: [
                            {
                              type: 'div',
                              props: {
                                style: { width: 40, height: 40, backgroundColor: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, color: 'black', fontWeight: 'bold' },
                                children: 'K'
                              }
                            },
                            {
                              type: 'div',
                              props: {
                                style: { fontSize: 24, color: '#e4e4e7' },
                                children: 'Kompot'
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ],
      },
    },
    {
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
    }
  );

  const resvg = new Resvg(svg, {
    background: '#09090b',
    fitTo: {
      mode: 'width',
      value: OG_WIDTH,
      },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Compress final OG image via sharp
  const compressed = await sharp(pngBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'fill' })
      .png({ quality: OG_PNG_QUALITY, compressionLevel: 9, palette: true })
      .toBuffer();

  fs.writeFileSync(outputPath, compressed);
  console.log(`  -> ${(pngBuffer.length / 1024).toFixed(0)}KB -> ${(compressed.length / 1024).toFixed(0)}KB`);
}

async function generate() {
  const fontData = await getFont();
  
  // 1. Generate for Posts
  const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    
    const title = data.title || 'DevOps adventure';
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
