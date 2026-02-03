import React from 'react';
import { BlogPost } from '../types';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ArticleViewProps {
  post: BlogPost;
  onBack: () => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ post, onBack }) => {
  return (
    <div className="animate-fade-in pb-12">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-emerald-400 mb-6 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Wróć do listy
      </button>

      <article className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {post.imageUrl && (
          <div className="h-64 sm:h-80 w-full relative">
             <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          </div>
        )}
        
        <div className="p-6 sm:p-10">
          <header className="mb-8">
            <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
                {new Date(post.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                {post.readTime}
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="prose prose-invert prose-emerald max-w-none">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mt-12 mb-6" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mt-10 mb-5 pb-2 border-b border-slate-800" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-8 mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-4 text-slate-300 marker:text-emerald-500" {...props} />,
                li: ({node, ...props}) => <li className="mb-2 pl-2" {...props} />,
                p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-4" {...props} />,
                a: ({node, ...props}) => <a className="text-emerald-400 hover:text-emerald-300 underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                pre: ({node, ...props}) => <div className="my-4 p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-sm text-emerald-100 overflow-x-auto"><pre {...props} /></div>,
                code: ({node, ...props}) => <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-200 font-mono text-sm" {...props} />,
                img: ({node, ...props}) => <img className="rounded-xl border border-slate-800 my-8 w-full" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 my-6 bg-slate-800/50 italic text-slate-400 rounded-r-lg" {...props} />
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

export default ArticleView;