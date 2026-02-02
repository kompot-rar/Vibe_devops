import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BlogList from './components/BlogList';
import BlogPostView from './components/BlogPostView';
import Roadmap from './components/Roadmap';
import CursorCodeEffect from './components/CursorCodeEffect';
import { Github, Linkedin, Server } from 'lucide-react';
import { getPosts } from './services/postService';

const About: React.FC = () => (
  <div className="max-w-2xl mx-auto bg-thinkpad-surface p-8 rounded-none border border-neutral-800 text-center animate-fade-in shadow-2xl shadow-black/50">
    <div className="w-24 h-24 bg-thinkpad-red rounded-none mx-auto mb-6 flex items-center justify-center shadow-lg shadow-thinkpad-red/20 transform rotate-3 hover:rotate-0 transition-all duration-300">
        <Server className="h-12 w-12 text-white" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-4 font-mono tracking-tighter uppercase">O Projekcie</h2>
    <p className="text-thinkpad-muted mb-6 leading-relaxed font-mono text-sm">
      Witaj na moim blogu! Nazywam się Łukasz Mróz i jestem zafascynowany DevOps. 
      Stworzyłem tę stronę, aby dokumentować moją naukę i dzielić się wiedzą z innymi.
      Korzystam z pomocy sztucznej inteligencji, aby szybciej zrozumieć trudne koncepty.
    </p>
    
    {/* Sekcja ikonek z animacją */}
    <div className="flex justify-center gap-8 mt-8">
      <a 
        href="https://github.com/kompot-rar" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-neutral-500 transform transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
        aria-label="GitHub Profile"
      >
        <Github size={32} />
      </a>
      
      <a 
        href="https://www.linkedin.com/in/%C5%82ukasz-mr%C3%B3z-b4980039a/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-neutral-500 transform transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:text-[#0A66C2] hover:drop-shadow-[0_0_15px_rgba(10,102,194,0.6)]"
        aria-label="LinkedIn Profile"
      >
        <Linkedin size={32} />
      </a>
    </div>
  </div>
);

const App: React.FC = () => {
  const posts = useMemo(() => getPosts(), []);

  return (
    <Router>
      <div className="min-h-screen bg-thinkpad-base flex flex-col font-sans selection:bg-thinkpad-red selection:text-white relative">
        <CursorCodeEffect />
        <Navbar />
        
        <main className="flex-grow relative z-10">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={
                <>
                  <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight font-mono">
                      DevOps <span className="text-thinkpad-red">Adventure</span>
                    </h1>
                    <p className="text-lg text-thinkpad-muted max-w-2xl mx-auto font-mono border-l-2 border-thinkpad-red pl-4">
                      Dokumentacja podróży w głąb infrastruktury. Od pojedynczego skryptu do orkiestracji klastrów.
                    </p>
                  </div>
                  <BlogList posts={posts} />
                </>
              } />
              <Route path="/blog/:slug" element={<BlogPostView posts={posts} />} />
              <Route path="/roadmap" element={<Roadmap />} />

              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </main>

        <footer className="bg-thinkpad-surface border-t border-neutral-800 relative z-10">
          <div className="max-w-7xl mx-auto py-8 px-4 text-center text-neutral-600 text-sm font-mono">
            <p>&copy; {new Date().getFullYear()} DevOps Starter Hub. <span className="text-thinkpad-red">Code is Law.</span></p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;