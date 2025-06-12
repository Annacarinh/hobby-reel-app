import React from 'react';
import { DesignStyle } from '../designStyles';
import { ShowreelDesignStyle } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface DesignStyleCardProps {
  design: DesignStyle;
  isSelected: boolean;
  onSelect: (id: ShowreelDesignStyle) => void;
}

const DesignStyleCard: React.FC<DesignStyleCardProps> = ({ design, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(design.id)}
      className={`
        relative p-3 sm:p-4 rounded-lg shadow-md cursor-pointer 
        transition-all duration-200 ease-in-out transform 
        hover:scale-105 focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-brand-blue border-2 
        flex flex-col items-center justify-center 
        min-h-[120px] sm:min-h-[140px]
        ${design.pageBgColor} // Apply pageBgColor as a Tailwind class
        ${isSelected ? 'border-brand-lime scale-105 shadow-xl' : 'border-brand-blue/20 hover:border-brand-blue/40'}
      `}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); // Prevent page scroll on space
          onSelect(design.id);
        }
      }}
      title={`Select design: ${design.name}`}
    >
      <h4 
        className={`font-poppins font-bold text-center mb-2 truncate text-sm ${design.primaryTextColor}`} // Apply primaryTextColor as a Tailwind class
      >
        {design.name}
      </h4>
      <img 
        src={design.stickySkullUrl} 
        alt="" // Alt text is empty as it's decorative in this context
        className="w-10 h-10 sm:w-12 sm:h-12 mx-auto object-contain" 
        aria-hidden="true"
      />
      {/* "Preview Text" div has been removed */}

      {isSelected && (
        <div 
            className="absolute top-1.5 right-1.5 bg-brand-lime rounded-full p-0.5 shadow-lg"
            aria-hidden="true"
        >
          <CheckCircleIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default DesignStyleCard;