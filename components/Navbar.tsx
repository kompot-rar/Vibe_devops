import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import GlitchLogo from './GlitchLogo';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const location = useLocation();

  const navItems: { name: string; path: string; live?: boolean }[] = [
    { name: 'Blog', path: '/' },
    { name: 'Playground', path: '/playground', live: true },
    { name: 'Roadmapa', path: '/roadmap' },
    { name: 'O Projekcie', path: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const EKG_PATH =
    'M0 5 H14 L16 5 L18 1.5 L20 8.5 L22 3 L24 5 H46 L48 5 L50 2.5 L52 7.5 L54 5 H78 L80 5 L82 1 L84 9 L86 3 L88 5 H100';

  const EKGLine: React.FC = () => (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-0.5 mx-auto h-2 w-[85%] overflow-hidden opacity-70"
    >
      <span className="flex h-full w-[200%] animate-ekg-scroll [filter:drop-shadow(0_0_1.5px_rgba(52,211,153,0.55))]">
        <svg
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          className="h-full w-1/2 shrink-0"
        >
          <path
            d={EKG_PATH}
            fill="none"
            stroke="#34d399"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <svg
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          className="h-full w-1/2 shrink-0"
        >
          <path
            d={EKG_PATH}
            fill="none"
            stroke="#34d399"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </span>
    </span>
  );

  return (
    <nav className="sticky top-0 z-50 bg-thinkpad-base/40 backdrop-blur-md border-b border-neutral-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* --- TU JEST ZMIANA: Używamy <a> zamiast <Link> --- */}
          {/* To wymusi odświeżenie strony i powrót do listy postów */}
          <div className="flex items-center">
            <a 
              href="/" 
              className="flex-shrink-0 flex items-center gap-3 group cursor-pointer"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              <div className="bg-neutral-900 border border-neutral-700 p-2 rounded-sm transition-all duration-300 group-hover:border-thinkpad-red shadow-sm flex items-center justify-center min-w-[40px] h-[40px]">
                <span className="font-mono text-lg font-bold text-thinkpad-red leading-none">
                  &gt;<span className="text-white animate-blink">_</span>
                </span>
              </div>
              <GlitchLogo isHovered={isLogoHovered} />
            </a>
          </div>
          {/* -------------------------------------------------- */}
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-none text-sm font-mono tracking-wide transition-all duration-200 border-b-2 ${
                    isActive(item.path)
                      ? 'border-thinkpad-red text-white bg-neutral-900'
                      : 'border-transparent text-thinkpad-muted hover:bg-neutral-900 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {item.name}
                  {item.live && <EKGLine />}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden bg-thinkpad-surface border-b border-neutral-800 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`relative block px-3 py-2 rounded-none text-base font-mono border-l-4 ${
                  isActive(item.path)
                    ? 'border-thinkpad-red bg-neutral-900 text-white'
                    : 'border-transparent text-thinkpad-muted hover:bg-neutral-900 hover:text-white hover:border-neutral-700'
                }`}
              >
                {item.name}
                {item.live && <EKGLine />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
