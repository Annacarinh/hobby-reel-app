import React from 'react';

export const SkullIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    stroke="currentColor" 
    strokeWidth="0.5" // Thinner stroke for a less cartoonish look if filled
    {...props}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm-1.532 7.52c-.42-.276-1.005-.05-1.28.37-.276.42-.05.996.37 1.28.42.276 1.005.05 1.28-.37.276-.43.05-.996-.37-1.28zm3.064 0c-.42-.276-1.005-.05-1.28.37-.276.42-.05.996.37 1.28.42.276 1.005.05 1.28-.37.276-.43.05-.996-.37-1.28zM7 15c0 .552.448 1 1 1h8c.552 0 1-.448 1-1v-1H7v1zm1 3v1h1v-1H8zm2 0v1h1v-1h-1zm2 0v1h1v-1h-1zm2 0v1h1v-1h-1z" 
    />
    {/* Simplified teeth attempt - might need more complex paths for good skull teeth */}
    <path d="M9 16h1v1H9zM11 16h1v1h-1zM13 16h1v1h-1zM15 16h1v1h-1z" />
  </svg>
);