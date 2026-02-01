import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlogPost } from '../types';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

interface BlogPostViewProps {
  posts: BlogPost[];
}

const BlogPostView: React.FC<BlogPostViewProps> = ({ posts }) => {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find(p => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Nie znaleziono posta</h2>
        <Link to="/" className="text-thinkpad-red hover:underline">Wróć do strony głównej</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <Link 
        to="/"
        className="mb-8 flex items-center text-neutral-500 hover:text-thinkpad-red transition-colors group font-mono uppercase text-sm tracking-widest"
      >
        <ArrowRight className="rotate-180 mr-2 group-hover:-translate-x-1 transition-transform" size={16} />
        Wróć do listy
      </Link>

      <article className="bg-thinkpad-surface rounded-sm border border-neutral-800 overflow-hidden shadow-2xl">
        {/* Header obrazka */}
        <div className="relative h-64 sm:h-96 w-full overflow-hidden transition-all duration-700">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-thinkpad-surface via-thinkpad-surface/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 sm:p-12 w-full">
             <div className="flex gap-2 mb-4 flex-wrap">
                {post.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-red-500/10 text-red-200 border border-red-500/20 text-xs font-mono font-bold uppercase tracking-wider rounded-none">
                    #{tag}
                  </span>
                ))}
             </div>
             <h1 className="text-3xl sm:text-5xl font-bold text-white leading-none tracking-tight font-mono mb-2 shadow-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                {post.title}
             </h1>
          </div>
        </div>

        <div className="p-8 sm:p-12 bg-thinkpad-surface">
          {/* Metadane */}
          <div className="flex gap-8 text-xs font-mono uppercase tracking-widest text-neutral-500 mb-10 border-b border-neutral-800 pb-6">
            <span className="flex items-center gap-2"><Calendar size={14} className="text-thinkpad-red"/> {post.date}</span>
            <span className="flex items-center gap-2"><Clock size={14} className="text-thinkpad-red"/> {post.readTime}</span>
          </div>

          {/* Renderowana treść z react-markdown */}
          <div className="prose prose-invert max-w-none 
            prose-p:text-lg prose-p:leading-relaxed prose-p:text-thinkpad-text prose-p:mb-6
            prose-headings:font-mono prose-headings:uppercase prose-headings:tracking-wide
            
            prose-h1:text-4xl prose-h1:mt-12 prose-h1:mb-8
            prose-h2:text-3xl prose-h2:font-bold prose-h2:border-b prose-h2:border-neutral-800 prose-h2:pb-4 prose-h2:mt-16 prose-h2:mb-8
            prose-h3:text-2xl prose-h3:font-bold prose-h3:text-thinkpad-red prose-h3:mt-12 prose-h3:mb-6
            
            prose-ul:my-6 prose-ol:my-6
            prose-li:text-lg prose-li:my-2 prose-li:marker:text-thinkpad-red
            
            prose-pre:bg-[#282c34] prose-pre:border prose-pre:border-neutral-700 prose-pre:my-8
            prose-blockquote:border-l-4 prose-blockquote:border-thinkpad-red prose-blockquote:bg-neutral-900/50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:my-8 prose-blockquote:text-xl prose-blockquote:font-light prose-blockquote:italic
            
            prose-a:text-thinkpad-red prose-a:no-underline hover:prose-a:underline hover:prose-a:text-white transition-colors
            prose-img:rounded-sm prose-img:border prose-img:border-neutral-800 prose-img:shadow-lg prose-img:my-8">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPostView;