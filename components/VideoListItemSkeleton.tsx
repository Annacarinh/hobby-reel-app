import React from 'react';

const VideoListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-brand-blue/10 animate-pulse">
      <div className="flex-grow mr-3 space-y-1.5">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
      <div className="flex-shrink-0 flex items-center space-x-2">
        <div className="h-7 w-7 bg-gray-300 rounded-md"></div>
        <div className="h-7 w-7 bg-gray-300 rounded-md"></div>
      </div>
    </div>
  );
};

export default VideoListItemSkeleton;