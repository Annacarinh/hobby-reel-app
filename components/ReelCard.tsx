import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Showreel } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ShareIcon } from './icons/ShareIcon'; 

interface ReelCardProps {
  reel: Showreel;
  onDelete: (id: string) => void;
  onShare: (reel: Showreel) => void; 
}

const ReelCard: React.FC<ReelCardProps> = ({ reel, onDelete, onShare }) => {
  const navigate = useNavigate();
  const featuredVideo = reel.featuredVideo;
  const isPlaceholder = featuredVideo && featuredVideo.thumbnailUrl.includes('placehold.co');

  const displayTitle = (reel as any).directorName !== undefined && (reel as any).brandName !== undefined
    ? `${(reel as any).directorName} X ${(reel as any).brandName}`
    : (reel as any).title || "Untitled Showreel";

  const handleCardClick = () => {
    navigate(`/edit/${reel.id}`);
  };

  const handleActionClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation(); 
  };

  return (
    <div 
      className={`border border-brand-blue/20 overflow-hidden transition-all flex flex-col cursor-pointer ${!isPlaceholder ? '' : ''}`} 
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
      title={`Edit showreel: ${displayTitle}`} 
    >
      {featuredVideo && (
        <div className="aspect-16/9 bg-brand-pink/30 overflow-hidden">
          <img 
            src={featuredVideo.thumbnailUrl} 
            alt={featuredVideo.title} 
            className="w-full h-full object-cover object-center scale-[1.3] transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-brand-blue mb-2 truncate" title={displayTitle}>{displayTitle}</h3>
        <p className="text-xs text-brand-blue/70 mb-1">Created: {new Date(reel.createdAt).toLocaleDateString()}</p>
        <p className="text-sm text-brand-blue/80 mb-4">
          {reel.otherVideos.length + 1} video{reel.otherVideos.length === 0 ? '' : 's'}
        </p>
        <div className="mt-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Link 
            to={`/reel/${reel.id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex-1 text-center bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-lime hover:text-brand-blue transition-colors text-sm font-semibold flex items-center justify-center space-x-1"
            onClick={handleActionClick}
            aria-label={`View showreel: ${displayTitle}`}
            title={`View Showreel: ${displayTitle}`}
          >
            <EyeIcon className="w-4 h-4 text-white group-hover:text-brand-lime" />
            <span className="text-white group-hover:text-brand-blue">View</span>
          </Link>
          <button 
            onClick={(e) => {
              handleActionClick(e);
              onShare(reel);
            }}
            className="group flex-1 text-center bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-lime hover:text-brand-blue transition-colors text-sm font-semibold flex items-center justify-center space-x-1"
            aria-label={`Share showreel: ${displayTitle}`}
            title={`Share Showreel: ${displayTitle}`}
          >
            <ShareIcon className="w-4 h-4 text-white group-hover:text-brand-lime" />
            <span className="text-white group-hover:text-brand-blue">Share</span>
          </button>
          <button 
            onClick={(e) => {
              handleActionClick(e);
              onDelete(reel.id);
            }}
            className="group flex-1 text-center bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-lime hover:text-brand-blue transition-colors text-sm font-semibold flex items-center justify-center space-x-1"
            aria-label={`Delete showreel: ${displayTitle}`}
            title={`Delete Showreel: ${displayTitle}`}
          >
            <TrashIcon className="w-4 h-4 text-white group-hover:text-brand-lime" />
            <span className="text-white group-hover:text-brand-blue">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReelCard;