import React, { useState, useEffect, useRef } from 'react';

interface GlitchLogoProps {
  isHovered: boolean;
}

const GlitchLogo: React.FC<GlitchLogoProps> = ({ isHovered }) => {
  const originalText = "DevOpsZeroToHero";
  const [displayText, setDisplayText] = useState(originalText);
  const [isGlitching, setIsGlitching] = useState(false);
  const [isRed, setIsRed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`";

  useEffect(() => {
    if (isHovered) {
      // Start glitch
      setIsGlitching(true);
      setIsRed(true);
      let iteration = 0;
      const maxIterations = 8; 

      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      intervalRef.current = setInterval(() => {
        setDisplayText(
          originalText.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
        );
        
        iteration++;
        if (iteration >= maxIterations) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDisplayText(originalText);
          setIsGlitching(false);
          
          // Keep red for a moment, then fade
          timeoutRef.current = setTimeout(() => {
            setIsRed(false);
          }, 300);
        }
      }, 50);
    } else {
      // Reset
      setIsGlitching(false);
      setIsRed(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setDisplayText(originalText);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHovered]);

  const renderContent = () => {
    if (isGlitching) {
       return <span className="text-thinkpad-red">{displayText}</span>;
    }

    const transitionClass = "transition-colors duration-[10000ms] ease-out";

    return (
      <>
        <span className={`${transitionClass} ${isRed ? 'text-thinkpad-red' : 'text-white'}`}>DevOps</span>
        <span className={`${transitionClass} text-thinkpad-red`}>Zero</span>
        <span className={`${transitionClass} ${isRed ? 'text-thinkpad-red' : 'text-white'}`}>ToHero</span>
      </>
    );
  };

  return (
    <span className="text-xl font-bold font-mono tracking-tighter inline-block min-w-[180px]">
      {renderContent()}
    </span>
  );
};

export default GlitchLogo;