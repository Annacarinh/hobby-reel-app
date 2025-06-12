import React from 'react';

// Using ModernPlayIcon's SVG content as a base for CustomPlayIcon
export const CustomPlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height={props.height || "24px"} // Default height, can be overridden
    viewBox="0 0 24 24" 
    width={props.width || "24px"}   // Default width, can be overridden
    fill="currentColor" 
    {...props}
  >
    <path d="M0 0h24v24H0V0z" fill="none"/> {/* Ensures background is transparent */}
    {/* Path from ModernPlayIcon: A triangle inside a circle */}
    <path d="M10 16.5v-9l6 4.5-6 4.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
  </svg>
);