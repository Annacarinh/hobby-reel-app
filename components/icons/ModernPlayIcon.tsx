import React from 'react';

// Material Symbols: play_circle (Outlined)
// A modern, clean play icon.
export const ModernPlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height={props.height || "24px"} 
    viewBox="0 0 24 24" 
    width={props.width || "24px"} 
    fill="currentColor" // Controlled by Tailwind's text color utility
    {...props}
  >
    <path d="M0 0h24v24H0V0z" fill="none"/> {/* Ensures background is transparent if not set explicitly */}
    <path d="M10 16.5v-9l6 4.5-6 4.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
  </svg>
);