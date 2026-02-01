import matter from 'gray-matter';
import { BlogPost } from '../types';

// Load all markdown files from /posts directory
const modules = import.meta.glob('/posts/*.md', { query: '?raw', import: 'default', eager: true });

export const getPosts = (): BlogPost[] => {
  const posts: BlogPost[] = Object.keys(modules).map((path) => {
    const fileContent = modules[path] as string;
    const { data, content } = matter(fileContent);
    
    // Extract slug from filename: /posts/my-slug.md -> my-slug
    const slug = path.split('/').pop()?.replace(/\.md$/, '') || '';

    return {
      id: data.id || slug,
      slug: slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      content: content,
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      readTime: data.readTime || '5 min',
      imageUrl: data.imageUrl,
    };
  });

  // Sort by date descending
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getPostBySlug = (slug: string): BlogPost | undefined => {
  return getPosts().find(post => post.slug === slug);
};
