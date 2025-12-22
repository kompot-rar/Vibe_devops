import React, { useState } from 'react';
import { BlogPost } from '../types';
import { BookOpen } from 'lucide-react';
import ArticleView from './ArticleView';

interface BlogListProps {
  posts: BlogPost[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  if (selectedPost) {
    return <ArticleView post={selectedPost} onBack={() => setSelectedPost(null)} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Najnowsze wpisy</h2>
          <p className="text-slate-400">Śledź moją drogę od zera do Cloud Architecta.</p>
        </div>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-20 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
          <p className="text-slate-500">Brak wpisów. Zajrzyj do panelu administratora.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => setSelectedPost(post)}
            className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-900/10 transition-all cursor-pointer flex flex-col h-full"
          >
            <div className="h-48 overflow-hidden relative">
              <img 
                src={post.imageUrl || 'https://picsum.photos/800/400'} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors" />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex gap-2 mb-3 flex-wrap">
                {post.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-900">
                    #{tag}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-1">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800">
                <span>{new Date(post.date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} /> {post.readTime}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogList;