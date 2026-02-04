
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

console.log('Patching meta tags for posts...');

for (const file of files) {
  const filePath = path.join(POSTS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: markdownBody } = matter(content);
  
  const title = data.title || 'Vibe DevOps Post';
  const slug = file.replace('.md', '');
  const description = data.description || markdownBody.slice(0, 150).replace(/[\r\n#*]/g, ' ').trim() + '...';
  
  const metaTags = `
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title} | Vibe DevOps" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${DOMAIN}/og/posts/${slug}.png" />
    <meta property="og:url" content="${DOMAIN}/posts/${slug}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title} | Vibe DevOps" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${DOMAIN}/og/posts/${slug}.png" />
  `;

  // Create post directory in dist
  const postDir = path.join(DIST_DIR, 'posts', slug);
  if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true });
  }

  // Inject meta tags
  const patchedHtml = templateHtml.replace('</head>', `${metaTags}
  </head>`);

  fs.writeFileSync(path.join(postDir, 'index.html'), patchedHtml);
  console.log(`Patched: posts/${slug}/index.html`);
}

console.log('Meta patching complete!');
