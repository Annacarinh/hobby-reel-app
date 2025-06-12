import React from 'react';

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" // Using a 20x20 viewBox for finer lines if scaled small
    fill="currentColor" // Allows color control via text color
    stroke="currentColor" // Added stroke for visibility if fill is none or transparent in some contexts
    strokeWidth={props.strokeWidth || 1} // Default stroke-width, can be overridden
    {...props}
  >
    <path 
      fillRule="evenodd" 
      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" 
      clipRule="evenodd" 
    />
  </svg>
);