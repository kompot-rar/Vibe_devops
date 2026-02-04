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
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-thinkpad-surface via-thinkpad-surface/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 sm:p-8 pb-4 sm:pb-6 w-full">
             <h1 
                className="text-3xl sm:text-5xl font-bold text-white leading-none tracking-tight font-mono mb-2"
                style={{ textShadow: '0 4px 15px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,1)' }}
             >
                {post.title}
             </h1>
             <div className="flex gap-2 flex-wrap">
                {post.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-black/70 text-thinkpad-red border border-thinkpad-red/50 text-xs font-mono font-bold uppercase tracking-wider rounded-none backdrop-blur-sm shadow-md">
                    #{tag}
                  </span>
                ))}
             </div>
          </div>
        </div>

        <div className="p-8 sm:p-12 bg-thinkpad-surface">
          {/* Metadane */}
          <div className="flex gap-8 text-xs font-mono uppercase tracking-widest text-neutral-500 mb-10 border-b border-neutral-800 pb-6">
            <span className="flex items-center gap-2"><Calendar size={14} className="text-thinkpad-red"/> {post.date}</span>
            <span className="flex items-center gap-2"><Clock size={14} className="text-thinkpad-red"/> {post.readTime}</span>
          </div>

          {/* Renderowana treść z custom componentami (bez pluginu prose) */}
          <div className="font-sans max-w-3xl mx-auto">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-5xl font-mono uppercase tracking-wide text-white mt-20 mb-12" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-4xl font-bold font-mono uppercase tracking-wide text-white border-b border-neutral-800 pb-6 mt-24 mb-12" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-3xl font-bold font-mono uppercase tracking-wide text-thinkpad-red mt-16 mb-8" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-xl font-bold font-mono uppercase tracking-wide text-white mt-12 mb-6" {...props} />,
                p: ({node, ...props}) => <p className="text-xl text-neutral-300 leading-relaxed mb-8 font-normal font-sans" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-8 marker:text-thinkpad-red font-sans" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-8 marker:text-thinkpad-red font-sans" {...props} />,
                li: ({node, ...props}) => <li className="text-lg text-neutral-300 mb-3 pl-2 leading-relaxed" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-thinkpad-red bg-neutral-900/50 py-6 px-8 my-12 text-xl font-light italic text-neutral-400 font-sans" {...props} />,
                a: ({node, ...props}) => <a className="text-thinkpad-red hover:text-white hover:underline transition-colors font-medium" {...props} />,
                code: ({node, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');
                  return isInline ? (
                    <code className="bg-neutral-800 text-thinkpad-red px-1.5 py-0.5 rounded-sm font-mono text-sm" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({node, ...props}) => <pre className="bg-[#282c34] border border-neutral-700 rounded-none my-10 overflow-x-auto shadow-lg text-base" {...props} />,
                img: ({node, ...props}) => <img className="rounded-sm border border-neutral-800 shadow-lg my-12 w-full bg-black" {...props} />,
              }}
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