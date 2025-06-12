import React from 'react';

interface VideoCardSkeletonProps {
  cardVariant?: 'default' | 'compact'; // To match VideoCard, though 'compact' is primary use here
  className?: string;
}

const VideoCardSkeleton: React.FC<VideoCardSkeletonProps> = ({ cardVariant = 'compact', className = '' }) => {
  const isCompact = cardVariant === 'compact';

  // Base classes for the skeleton card
  const cardBaseClasses = `relative group rounded-lg border border-brand-blue/10 animate-pulse ${className}`;
  
  // Dynamic classes based on cardVariant (mimicking VideoCard compact variant)
  const detailsPaddingClass = isCompact ? 'p-1.5' : 'p-3';
  const detailsSpacingClass = isCompact ? 'space-y-0.5' : 'space-y-1'; // For spacing between skeleton lines
  const titleLineHeight = isCompact ? 'h-3' : 'h-4'; // Approx height for title lines
  const durationLineHeight = 'h-2.5'; // Approx height for duration line
  const buttonHeight = isCompact ? 'h-6' : 'h-8'; // Approx height for button placeholders
  const buttonWidthClass = 'w-1/2'; // Buttons take half width each typically

  return (
    <div className={`${cardBaseClasses} flex flex-col`}>
      {/* Thumbnail Placeholder */}
      <div className="aspect-16/9 bg-gray-300 rounded-t-lg"></div>

      {/* Details Placeholder */}
      <div className={`${detailsPaddingClass} ${detailsSpacingClass} bg-gray-200 rounded-b-lg`}>
        {/* Title Lines */}
        <div className={`${titleLineHeight} bg-gray-300 rounded w-5/6`}></div>
        <div className={`${titleLineHeight} bg-gray-300 rounded w-4/6`}></div>

        {/* Duration/Date Line */}
        <div className="flex justify-between items-center">
          <div className={`${durationLineHeight} bg-gray-300 rounded w-1/4`}></div>
          <div className={`${durationLineHeight} bg-gray-300 rounded w-1/3`}></div>
        </div>

        {/* Action Buttons Placeholder */}
        <div className={`flex items-center space-x-2 ${isCompact ? 'pt-0.5' : 'pt-1'}`}>
          <div className={`${buttonHeight} ${buttonWidthClass} bg-gray-300 rounded`}></div>
          <div className={`${buttonHeight} ${buttonWidthClass} bg-gray-300 rounded`}></div>
        </div>
      </div>
    </div>
  );
};

export default VideoCardSkeleton;