import React, { useState } from 'react';
import { BlogPost } from '../types';
import { BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react';

interface BlogListProps {
  posts: BlogPost[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // --- PARSER (To jest silnik, który naprawia formatowanie i diagramy) ---
  const parseBold = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
               .replace(/`(.*?)`/g, '<code class="bg-slate-800 text-emerald-300 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
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
        return <div key={index} className="bg-slate-900 text-emerald-400 font-mono text-sm p-2 border-l-2 border-slate-700 overflow-x-auto">{line}</div>;
      }

      // Nagłówki
      if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold text-white mt-8 mb-4">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-bold text-emerald-400 mt-6 mb-3">{line.replace('### ', '')}</h3>;

      // Obrazki (Markdown i HTML)
      if (line.includes('<img')) return <div key={index} dangerouslySetInnerHTML={{ __html: line }} />;
      if (line.includes('![') && line.includes('](')) {
          const src = line.match(/\((.*?)\)/)?.[1];
          return src ? <img key={index} src={src} className="w-full rounded-xl border border-slate-700 my-6" /> : null;
      }

      // Listy
      if (line.trim().startsWith('- ')) {
        return <li key={index} className="ml-4 text-slate-300 list-disc marker:text-emerald-500 mb-1"><span dangerouslySetInnerHTML={{ __html: parseBold(line.replace('- ', '')) }} /></li>;
      }

      // Puste linie i paragrafy
      if (line.trim() === '') return <div key={index} className="h-4"></div>;
      
      return <p key={index} className="text-slate-300 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: parseBold(line) }} />;
    });
  };
  // -----------------------------------------------------------------------

  // WIDOK ARTYKUŁU (Otwarty post)
  if (selectedPost) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <button 
          onClick={() => setSelectedPost(null)}
          className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowRight className="rotate-180 mr-2 group-hover:-translate-x-1 transition-transform" size={20} />
          Wróć do listy
        </button>

        <article className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Header obrazka */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden">
            <img 
              src={selectedPost.imageUrl} 
              alt={selectedPost.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
               <div className="flex gap-2 mb-3">
                  {selectedPost.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono rounded border border-emerald-500/30">
                      #{tag}
                    </span>
                  ))}
               </div>
               <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
                  {selectedPost.title}
               </h1>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            {/* Metadane */}
            <div className="flex gap-6 text-sm text-slate-400 mb-8 border-b border-slate-800 pb-6">
              <span className="flex items-center gap-2"><Calendar size={16} className="text-emerald-500"/> {selectedPost
