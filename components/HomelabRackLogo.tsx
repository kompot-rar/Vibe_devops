import React from 'react';

const HomelabRackLogo: React.FC<{ className?: string }> = ({ className = "h-full w-full" }) => {
  // ThinkPad Colors (Matched to index.css)
  const colors = {
    black: "#0a0b10", // thinkpad-base
    darkGrey: "#16181d", // thinkpad-surface
    red: "#ff002b", // thinkpad-red
    ledGreen: "#00ff00",
    ledBlue: "#00ccff",
    metal: "#4a4a4a"
  };

  return (
    <svg 
      viewBox="0 0 100 150" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rack Frame 6U */}
      <rect x="5" y="5" width="90" height="140" rx="2" fill={colors.black} stroke={colors.metal} strokeWidth="2" />
      
      {/* U1: Patch Panel */}
      <g transform="translate(10, 10)">
        <rect width="80" height="18" rx="1" fill={colors.darkGrey} />
        {/* Ports */}
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={5 + i * 6} y="5" width="4" height="8" fill="black" stroke={colors.metal} strokeWidth="0.5" />
        ))}
        <text x="2" y="12" fontSize="3" fill="white" opacity="0.5">PATCH</text>
      </g>

      {/* U2: Netgear Switch */}
      <g transform="translate(10, 32)">
        <rect width="80" height="18" rx="1" fill="#1a1a1a" stroke={colors.metal} strokeWidth="0.5" />
        <text x="70" y="12" fontSize="3" fill="white" fontWeight="bold">NETGEAR</text>
        {/* 8 Ports */}
        {Array.from({ length: 8 }).map((_, i) => (
          <g key={i} transform={`translate(${5 + i * 8}, 4)`}>
            <rect width="6" height="6" fill="#333" stroke="black" strokeWidth="0.5" />
            {/* Link Lights */}
            <circle cx="1" cy="8" r="0.8" fill={Math.random() > 0.3 ? colors.ledGreen : "#113311"} />
            <circle cx="5" cy="8" r="0.8" fill={Math.random() > 0.3 ? colors.ledGreen : "#113311"} />
          </g>
        ))}
      </g>

      {/* U3: Node 1 (M710) */}
      <g transform="translate(10, 54)">
        <rect width="80" height="18" rx="1" fill={colors.black} stroke={colors.metal} strokeWidth="0.5" />
        <rect x="2" y="3" width="76" height="12" fill={colors.darkGrey} />
        {/* Vent pattern */}
        <path d="M5 5 H40" stroke="black" strokeWidth="1" strokeDasharray="2 1" />
        <path d="M5 8 H40" stroke="black" strokeWidth="1" strokeDasharray="2 1" />
        <path d="M5 11 H40" stroke="black" strokeWidth="1" strokeDasharray="2 1" />
        {/* Logo & Power */}
        <rect x="65" y="5" width="8" height="8" rx="4" fill={colors.black} />
        <circle cx="69" cy="9" r="1.5" fill={colors.ledGreen} opacity="0.8" />
        <rect x="75" y="5" width="2" height="8" fill={colors.red} />
        <text x="45" y="12" fontSize="3" fill="white">M710</text>
      </g>

      {/* U4: Node 2 (M83) */}
      <g transform="translate(10, 76)">
        <rect width="80" height="18" rx="1" fill={colors.black} stroke={colors.metal} strokeWidth="0.5" />
        <rect x="2" y="3" width="76" height="12" fill={colors.darkGrey} />
         {/* Vent pattern */}
        <path d="M5 5 H40" stroke="black" strokeWidth="1" strokeDasharray="2 1" />
        <path d="M5 8 H40" stroke="black" strokeWidth="1" strokeDasharray="2 1" />
        <path d="M5 11 H40" stroke="black" strokeWidth="1" strokeDasharray="2 1" />
         {/* Logo & Power */}
        <rect x="65" y="5" width="8" height="8" rx="4" fill={colors.black} />
        <circle cx="69" cy="9" r="1.5" fill={colors.ledGreen} opacity="0.8" />
        <rect x="75" y="5" width="2" height="8" fill={colors.red} />
        <text x="45" y="12" fontSize="3" fill="white">M83</text>
      </g>

      {/* U5: Node 3 (M710q) */}
      <g transform="translate(10, 98)">
        <rect width="80" height="18" rx="1" fill={colors.black} stroke={colors.metal} strokeWidth="0.5" />
        <rect x="2" y="3" width="76" height="12" fill={colors.darkGrey} />
         {/* Vent pattern */}
        <path d="M5 5 H40" stroke="black" strokeWidth="1" strokeDasharray="2 1" />
        <path d="M5 8 H40" stroke="black" strokeWidth="1" strokeDasharray="2 1" />
        <path d="M5 11 H40" stroke="black" strokeWidth="1" strokeDasharray="2 1" />
         {/* Logo & Power */}
        <rect x="65" y="5" width="8" height="8" rx="4" fill={colors.black} />
        <circle cx="69" cy="9" r="1.5" fill={colors.ledGreen} opacity="0.8" />
        <rect x="75" y="5" width="2" height="8" fill={colors.red} />
        <text x="45" y="12" fontSize="3" fill="white">M710q</text>
      </g>

      {/* U6: Power Strip */}
      <g transform="translate(10, 120)">
        <rect width="80" height="18" rx="1" fill="#222" stroke={colors.metal} strokeWidth="0.5" />
        {/* Switch */}
        <rect x="5" y="4" width="10" height="10" fill={colors.red} />
        <rect x="8" y="7" width="4" height="4" fill="#ff6666" />
        {/* Outlets */}
        {Array.from({ length: 4 }).map((_, i) => (
           <circle key={i} cx={25 + i * 15} cy="9" r="4" fill="#111" stroke="gray" strokeWidth="0.5" />
        ))}
      </g>

      {/* Rack Rails */}
      <rect x="6" y="5" width="4" height="140" fill={colors.metal} opacity="0.3" />
      <rect x="90" y="5" width="4" height="140" fill={colors.metal} opacity="0.3" />

    </svg>
  );
};

export default HomelabRackLogo;
