import React from 'react';
import { VimeoVideo } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
// CheckCircleIcon is removed as it's no longer needed
// StarIconSolid is removed as isFeatured is no longer handled here
import { CloseIcon } from './icons/CloseIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';


interface VideoListItemProps {
  video: VimeoVideo;
  isSelected: boolean;
  onSelect: (videoId: string) => void;
  onPreview: (video: VimeoVideo) => void;
  privacyStatus?: string; 
}

const VideoListItem: React.FC<VideoListItemProps> = ({ 
  video, 
  isSelected, 
  onSelect, 
  onPreview,
  privacyStatus
}) => {
  const isEffectivelyPrivate = privacyStatus !== 'anybody' && privacyStatus !== 'unlisted';
  const itemClasses = `
    flex items-center justify-between p-3 border-b border-brand-blue/10 
    transition-all duration-150 ease-in-out
    ${isEffectivelyPrivate ? 'opacity-60 filter grayscale cursor-not-allowed' : 'hover:bg-brand-pink/20'}
    ${isSelected && !isEffectivelyPrivate ? 'bg-brand-pink/30' : ''}
  `;
  const titleClasses = `
    font-semibold line-clamp-1 sm:line-clamp-2
    ${isSelected && !isEffectivelyPrivate ? 'text-brand-blue' : 'text-brand-blue/90'}
    ${!isEffectivelyPrivate ? 'group-hover:text-brand-blue' : ''}
  `;

  const vimeoLink = `https://vimeo.com/${video.id}`;
  const buttonBasePadding = "p-2 md:p-1.5"; // Larger tap target on mobile

  return (
    <div 
      className={itemClasses}
      role="listitem"
      title={isEffectivelyPrivate ? `${video.title} (Private - Cannot be added)` : video.title}
    >
      <div className="flex-grow mr-3 overflow-hidden">
        <h4 
            className={titleClasses}
            title={video.title}
        >
          {video.title}
        </h4>
        <p className="text-xs text-brand-blue/70">
          {video.duration}
          {video.uploadDate && ` • Uploaded: ${video.uploadDate}`}
          {isEffectivelyPrivate && <span className="ml-2 font-semibold text-brand-blue/60">(Private)</span>}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center space-x-1 sm:space-x-1.5">
        <button
          type="button"
          onClick={() => onPreview(video)}
          className={`group ${buttonBasePadding} rounded-md hover:bg-brand-blue/10 focus:outline-none focus:ring-2 focus:ring-brand-lime`}
          title={`Preview Video: ${video.title}`}
          aria-label={`Preview video: ${video.title}`}
        >
          <EyeIcon className="w-5 h-5 text-brand-blue/70 group-hover:text-brand-blue transition-colors" />
        </button>

        {!isEffectivelyPrivate && (
             <a
                href={vimeoLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()} 
                className={`group ${buttonBasePadding} rounded-md hover:bg-brand-blue/10 focus:outline-none focus:ring-2 focus:ring-brand-lime`}
                title={`View on Vimeo: ${video.title}`}
                aria-label={`View video on Vimeo: ${video.title}`}
            >
                <ExternalLinkIcon className="w-5 h-5 text-brand-blue/70 group-hover:text-brand-blue transition-colors" />
            </a>
        )}

        {isEffectivelyPrivate ? (
            <div 
                className={`${buttonBasePadding} rounded-md text-brand-blue/50 cursor-not-allowed`}
                title="Private Video: Cannot be added to reel"
                aria-label={`Cannot add private video: ${video.title}`}
            >
                <CloseIcon className="w-5 h-5" />
            </div>
        ) : (
            <button
                type="button"
                onClick={() => onSelect(video.id)}
                className={`group ${buttonBasePadding} rounded-md text-white font-semibold text-xs transition-colors
                                ${isSelected 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-brand-blue hover:bg-brand-lime hover:text-brand-blue'}`}
                title={isSelected ? `Remove "${video.title}" from reel` : `Add "${video.title}" to reel`}
                aria-label={isSelected ? `Remove video from reel: ${video.title}` : `Add video to reel: ${video.title}`}
            >
            {isSelected 
                ? <TrashIcon className="w-5 h-5 text-white" /> 
                : <PlusIcon className="w-5 h-5 text-white group-hover:text-brand-lime" />}
            </button>
        )}
      </div>
    </div>
  );
};

export default VideoListItem;