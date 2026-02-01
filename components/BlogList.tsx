import React from 'react';
import { BlogPost } from '../types';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogListProps {
  posts: BlogPost[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  return (
    <div className="space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-mono uppercase tracking-tight">Najnowsze wpisy</h2>
          <p className="text-neutral-500 font-mono text-sm">Śledź moją drogę od zera do Cloud Architecta.</p>
        </div>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20 bg-neutral-900 rounded-none border border-neutral-800 border-dashed">
          <p className="text-neutral-500 font-mono">Brak wpisów. Zajrzyj do panelu administratora.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link 
            key={post.id} 
            to={`/blog/${post.slug}`}
            className="group bg-thinkpad-surface border border-neutral-700 rounded-none overflow-hidden hover:border-thinkpad-red transition-all duration-300 cursor-pointer flex flex-col h-full shadow-lg hover:shadow-[0_0_20px_rgba(224,6,19,0.3)]"
          >
            <div className="h-48 overflow-hidden relative transition-all duration-500">
              <img 
                src={post.imageUrl || 'https://picsum.photos/800/400'} 
                alt={post.title} 
                className="w-full h-full object-cover grayscale-[0.75] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-in-out"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
            </div>
            
            <div className="p-6 flex flex-col flex-1 relative">
              {/* Red line accent on top */}
              <div className="absolute top-0 left-0 w-0 h-1 bg-thinkpad-red group-hover:w-full transition-all duration-500 ease-out"></div>

              <div className="flex gap-2 mb-4 flex-wrap">
                {post.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs font-mono font-bold text-red-200/70 bg-red-900/10 px-2 py-0.5 border border-red-900/20 uppercase hover:text-red-100 hover:border-red-500/30 transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-thinkpad-red transition-colors line-clamp-2 font-mono tracking-tight">
                {post.title}
              </h3>
              
              <p className="text-neutral-400 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-neutral-500 mt-auto pt-4 border-t border-neutral-700 font-mono uppercase">
                <span>{new Date(post.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 group-hover:text-white transition-colors">
                  <BookOpen size={12} className="text-thinkpad-red" /> {post.readTime}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BlogList;
