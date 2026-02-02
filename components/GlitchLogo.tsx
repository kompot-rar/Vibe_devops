import React, { useState, useEffect, useRef } from 'react';

interface GlitchLogoProps {
  isHovered: boolean;
}

const GlitchLogo: React.FC<GlitchLogoProps> = ({ isHovered }) => {
  const originalText = "DevOpsZeroToHero";
  const [displayText, setDisplayText] = useState(originalText);
  const [isGlitching, setIsGlitching] = useState(false);
  const [hasGlitched, setHasGlitched] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`";

  useEffect(() => {
    if (isHovered) {
      // Start glitch
      setIsGlitching(true);
      setHasGlitched(false);
      let iteration = 0;
      const maxIterations = 8; 

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setDisplayText(
          originalText.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
        );
        
        iteration++;
        if (iteration >= maxIterations) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDisplayText(originalText);
          setIsGlitching(false);
          setHasGlitched(true);
        }
      }, 50);
    } else {
      // Reset
      setIsGlitching(false);
      setHasGlitched(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayText(originalText);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered]);

  const renderContent = () => {
    if (isGlitching) {
       return <span className="text-thinkpad-red">{displayText}</span>;
    }

    return (
      <>
        <span className="text-white">DevOps</span>
        <span className={hasGlitched ? "text-white" : "text-thinkpad-red"}>Zero</span>
        <span className="text-white">To</span>
        <span className={hasGlitched ? "text-thinkpad-red" : "text-white"}>Hero</span>
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