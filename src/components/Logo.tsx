import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="3D Calibration Pro Logo"
    >
      {/* Outer target reticle circle */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke="#4cd6fb"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeOpacity="0.4"
      />
      
      {/* Precision Crosshairs */}
      <line x1="50" y1="4" x2="50" y2="18" stroke="#4cd6fb" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="82" x2="50" y2="96" stroke="#4cd6fb" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4" y1="50" x2="18" y2="50" stroke="#4cd6fb" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="82" y1="50" x2="96" y2="50" stroke="#4cd6fb" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Inner Alignment Circle */}
      <circle
        cx="50"
        cy="50"
        r="32"
        stroke="#7bd0ff"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />

      {/* Isometric 3D Calibration Cube */}
      {/* Top Face */}
      <polygon
        points="50,22 74,36 50,50 26,36"
        fill="#00b4d8"
        stroke="#4cd6fb"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Right Face */}
      <polygon
        points="50,50 74,36 74,66 50,80"
        fill="#0077b6"
        stroke="#4cd6fb"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Left Face */}
      <polygon
        points="26,36 50,50 50,80 26,66"
        fill="#005f73"
        stroke="#4cd6fb"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Central Probe Dot */}
      <circle cx="50" cy="50" r="3.5" fill="#4cd6fb" />
      
      {/* Lower Caliper Datum Beacon */}
      <circle cx="50" cy="80" r="2.5" fill="#10b981" />
      <line x1="50" y1="72" x2="50" y2="78" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );
};
