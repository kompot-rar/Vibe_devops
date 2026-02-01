import React, { useState } from 'react';
import { BlogPost } from '../types';
import { BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react';

interface BlogListProps {
  posts: BlogPost[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // --- PARSER ---
  const parseBold = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold tracking-tight">$1</strong>')
               .replace(/`(.*?)`/g, '<code class="bg-neutral-800 text-thinkpad-red px-1.5 py-0.5 rounded-sm text-sm font-mono border border-neutral-700">$1</code>');
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    let inCodeBlock = false;

    return lines.map((line, index) => {
      // Kod
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return null;
      }
      if (inCodeBlock) {
        return <div key={index} className="bg-neutral-950 text-neutral-300 font-mono text-sm p-4 border-l-4 border-thinkpad-red overflow-x-auto shadow-inner">{line}</div>;
      }

      // Nagłówki
      if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold text-white mt-10 mb-6 font-mono uppercase tracking-wide border-b border-neutral-800 pb-2">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-bold text-thinkpad-red mt-8 mb-4 font-mono">{line.replace('### ', '')}</h3>;

      // Obrazki (Markdown i HTML)
      if (line.includes('<img')) return <div key={index} dangerouslySetInnerHTML={{ __html: line }} />;
      if (line.includes('![') && line.includes('](')) {
          const src = line.match(/\((.*?)\)/)?.[1];
          return src ? <img key={index} src={src} className="w-full rounded-sm border border-neutral-800 my-8 shadow-lg" /> : null;
      }

      // Listy
      if (line.trim().startsWith('- ')) {
        return <li key={index} className="ml-4 text-thinkpad-text list-square marker:text-thinkpad-red mb-2 pl-2"><span dangerouslySetInnerHTML={{ __html: parseBold(line.replace('- ', '')) }} /></li>;
      }

      // Puste linie i paragrafy
      if (line.trim() === '') return <div key={index} className="h-4"></div>;
      
      return <p key={index} className="text-thinkpad-text leading-loose mb-4 font-light" dangerouslySetInnerHTML={{ __html: parseBold(line) }} />;
    });
  };

  // WIDOK ARTYKUŁU (Otwarty post)
  if (selectedPost) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto">
        <button 
          onClick={() => setSelectedPost(null)}
          className="mb-8 flex items-center text-neutral-500 hover:text-thinkpad-red transition-colors group font-mono uppercase text-sm tracking-widest"
        >
          <ArrowRight className="rotate-180 mr-2 group-hover:-translate-x-1 transition-transform" size={16} />
          Wróć do listy
        </button>

        <article className="bg-thinkpad-surface rounded-sm border border-neutral-800 overflow-hidden shadow-2xl">
          {/* Header obrazka */}
          <div className="relative h-64 sm:h-96 w-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
            <img 
              src={selectedPost.imageUrl} 
              alt={selectedPost.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-thinkpad-surface via-thinkpad-surface/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 sm:p-12 w-full">
               <div className="flex gap-2 mb-4 flex-wrap">
                  {selectedPost.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-thinkpad-red text-white text-xs font-mono font-bold uppercase tracking-wider rounded-none">
                      #{tag}
                    </span>
                  ))}
               </div>
               <h1 className="text-3xl sm:text-5xl font-bold text-white leading-none tracking-tight font-mono mb-2 shadow-black drop-shadow-md">
                  {selectedPost.title}
               </h1>
            </div>
          </div>

          <div className="p-8 sm:p-12 bg-thinkpad-surface">
            {/* Metadane */}
            <div className="flex gap-8 text-xs font-mono uppercase tracking-widest text-neutral-500 mb-10 border-b border-neutral-800 pb-6">
              <span className="flex items-center gap-2"><Calendar size={14} className="text-thinkpad-red"/> {selectedPost.date}</span>
              <span className="flex items-center gap-2"><Clock size={14} className="text-thinkpad-red"/> {selectedPost.readTime}</span>
            </div>

            {/* Renderowana treść */}
            <div className="prose prose-invert max-w-none prose-p:text-thinkpad-text prose-headings:font-mono prose-a:text-thinkpad-red hover:prose-a:text-white">
              {renderContent(selectedPost.content)}
            </div>
          </div>
        </article>
      </div>
    );
  }

  // WIDOK LISTY (Kafelki)
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
          <div 
            key={post.id} 
            onClick={() => setSelectedPost(post)}
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
                  <span key={tag} className="text-xs font-mono font-bold text-neutral-400 bg-neutral-900/50 px-2 py-0.5 border border-neutral-800 uppercase hover:text-white hover:border-neutral-600 transition-colors">
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogList;
