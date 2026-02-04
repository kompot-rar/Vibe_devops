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
  
  const title = data.title || 'Vibe DevOps Post';
  const slug = file.replace('.md', '');
  const description = data.description || markdownBody.slice(0, 150).replace(/[\r\n#*]/g, ' ').trim() + '...';
  
  // Prefer imageUrl from frontmatter, otherwise use generated OG image
  let ogImage = `${DOMAIN}/og/posts/${slug}.png`;
  if (data.imageUrl) {
    // If imageUrl starts with /, prepend DOMAIN. If absolute, keep as is.
    ogImage = data.imageUrl.startsWith('/') 
      ? `${DOMAIN}${data.imageUrl}` 
      : data.imageUrl;
  }

  const metaTags = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title} | Vibe DevOps" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${DOMAIN}/blog/${slug}" />
    <meta property="og:logo" content="${DOMAIN}/bcr.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title} | Vibe DevOps" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
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
const homeMetaTags = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Łukasz Mróz | DevOps fromZEROtoHERO" />
    <meta property="og:description" content="Dokumentacja podróży w głąb infrastruktury. Od pojedynczego skryptu do orkiestracji klastrów." />
    <meta property="og:image" content="${DOMAIN}/og/home.png" />
    <meta property="og:url" content="${DOMAIN}" />
    <meta property="og:logo" content="${DOMAIN}/bcr.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Łukasz Mróz | DevOps fromZEROtoHERO" />
    <meta name="twitter:description" content="Dokumentacja podróży w głąb infrastruktury. Od pojedynczego skryptu do orkiestracji klastrów." />
    <meta name="twitter:image" content="${DOMAIN}/og/home.png" />
`;
const homeHtml = templateHtml.replace('</head>', `${homeMetaTags}\n  </head>`);
// Overwrite main index.html for root access
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homeHtml);
console.log('Patched: index.html (Home)');


// 3. Patch Roadmap Page
const roadmapMetaTags = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Roadmapa 2026 | Vibe DevOps" />
    <meta property="og:description" content="Master Plan CKA 2026. Moja ścieżka rozwoju i certyfikacji DevOps." />
    <meta property="og:image" content="${DOMAIN}/og/roadmap.png" />
    <meta property="og:url" content="${DOMAIN}/roadmap" />
    <meta property="og:logo" content="${DOMAIN}/bcr.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Roadmapa 2026 | Vibe DevOps" />
    <meta name="twitter:description" content="Master Plan CKA 2026. Moja ścieżka rozwoju." />
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