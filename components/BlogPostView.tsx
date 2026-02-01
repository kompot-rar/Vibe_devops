import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlogPost } from '../types';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { slugify } from '../src/utils/slugify';

interface BlogPostViewProps {
  posts: BlogPost[];
}

const BlogPostView: React.FC<BlogPostViewProps> = ({ posts }) => {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find(p => slugify(p.title) === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

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
          return src ? <img key={index} src={src} className="w-full rounded-sm border border-neutral-800 my-8 shadow-lg" alt="Blog content" /> : null;
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

          {/* Renderowana treść */}
          <div className="prose prose-invert max-w-none prose-p:text-thinkpad-text prose-headings:font-mono prose-a:text-thinkpad-red hover:prose-a:text-white">
            {renderContent(post.content)}
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPostView;
