import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../../posts');
const DIST_DIR = path.join(__dirname, '../../dist');
const DOMAIN = process.env.PUBLIC_URL || 'https://vibe-devops.pl';

if (!fs.existsSync(DIST_DIR)) {
  console.error('Dist directory not found. Run npm run build first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

console.log('Patching meta tags...');

// 1. Patch Blog Posts
for (const file of files) {
  const filePath = path.join(POSTS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: markdownBody } = matter(content);
  
  const title = data.title || 'DevOps Adventure';
  const slug = file.replace('.md', '');
  
  // Improved description cleaning: remove links, code, and special MD chars
  const cleanDescription = (data.excerpt || data.description || markdownBody)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove MD links, keep text
    .replace(/[`#*|_~]/g, '')                // Remove MD formatting
    .replace(/(\r\n|\n|\r)/gm, ' ')          // Replace newlines with spaces
    .replace(/\s+/g, ' ')                    // Collapse multiple spaces
    .trim()
    .slice(0, 160);

  const description = cleanDescription.length >= 160 ? cleanDescription + '...' : cleanDescription;
  
  const metaTags = `
  <meta name="description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${DOMAIN}/og/posts/${slug}.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${DOMAIN}/blog/${slug}" />
  <meta property="og:site_name" content="DevOps Adventure" />
  <meta property="og:locale" content="pl_PL" />
  <meta property="og:logo" content="${DOMAIN}/bcr.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${DOMAIN}/og/posts/${slug}.png" />
  `;
  const postDir = path.join(DIST_DIR, 'blog', slug);
  if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true });
  }

  const patchedHtml = templateHtml.replace('</head>', `${metaTags}\n  </head>`);
  fs.writeFileSync(path.join(postDir, 'index.html'), patchedHtml);
  console.log(`Patched: blog/${slug}/index.html`);
}

// 2. Patch Home Page
const homeDescription = "Dokumentacja podróży w głąb infrastruktury. Od pojedynczego skryptu do orkiestracji klastrów.";
const homeMetaTags = `
    <meta name="description" content="${homeDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="DevOps Adventure" />
    <meta property="og:description" content="${homeDescription}" />
    <meta property="og:image" content="${DOMAIN}/og/home.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${DOMAIN}" />
    <meta property="og:site_name" content="DevOps Adventure" />
    <meta property="og:locale" content="pl_PL" />
    <meta property="og:logo" content="${DOMAIN}/bcr.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="DevOps Adventure" />
    <meta name="twitter:description" content="${homeDescription}" />
    <meta name="twitter:image" content="${DOMAIN}/og/home.png" />
`;
const homeHtml = templateHtml.replace('</head>', `${homeMetaTags}\n  </head>`);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homeHtml);
console.log('Patched: index.html (Home)');


// 3. Patch Roadmap Page
const roadmapDescription = "Master Plan CKA 2026. Moja ścieżka rozwoju i certyfikacji DevOps.";
const roadmapMetaTags = `
<meta name="description" content="${roadmapDescription}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Roadmapa 2026" />
<meta property="og:description" content="${roadmapDescription}" />
<meta property="og:image" content="${DOMAIN}/og/roadmap.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${DOMAIN}/roadmap" />
<meta property="og:site_name" content="DevOps Adventure" />
<meta property="og:locale" content="pl_PL" />
<meta property="og:logo" content="${DOMAIN}/bcr.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Roadmapa 2026" />
<meta name="twitter:description" content="${roadmapDescription}" />
<meta name="twitter:image" content="${DOMAIN}/og/roadmap.png" />
`;
const roadmapDir = path.join(DIST_DIR, 'roadmap');
if (!fs.existsSync(roadmapDir)) {
  fs.mkdirSync(roadmapDir, { recursive: true });
}
const roadmapHtml = templateHtml.replace('</head>', `${roadmapMetaTags}\n  </head>`);
fs.writeFileSync(path.join(roadmapDir, 'index.html'), roadmapHtml);
console.log('Patched: roadmap/index.html');

console.log('Meta patching complete!');