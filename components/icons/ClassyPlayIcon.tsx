import React from 'react';

export const ClassyPlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24" // Standard viewBox for a simple shape
    fill="currentColor" // Color will be controlled by Tailwind's text color utility
    {...props}
  >
    {/* A more slender, elegant play triangle */}
    <path d="M8 6.82V17.18L17.18 12L8 6.82Z" />
  </svg>
);