import React, { useState, useEffect, useRef } from 'react';
import { VimeoVideo } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { StarIconSolid } from './icons/StarIconSolid';
import { PhotoIcon } from './icons/PhotoIcon'; 
import { CustomPlayIcon } from './icons/CustomPlayIcon'; 
import { PlayCircleIcon } from './icons/PlayCircleIcon'; 
import { DragHandleIcon } from './icons/DragHandleIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { CloseIcon } from './icons/CloseIcon'; // Added for remove button

interface VideoCardProps {
  video: VimeoVideo;
  isSelected: boolean;
  isFeatured?: boolean;
  onSelect: (videoId: string) => void;
  onMakeFeatured?: (videoId: string) => void; 
  showActions?: boolean;
  className?: string;
  onClick?: () => void;
  hideDetails?: boolean; 
  sharpCorners?: boolean; 

  isAdmin?: boolean; 
  customGifUrlValue?: string; 
  onSetCustomGif?: (videoId: string, gifUrl: string) => void;
  isEditingCustomGif?: boolean; 
  onToggleEditCustomGif?: (videoId: string) => void;

  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void; // Added for drop target
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemoveFromReel?: (videoId: string) => void; // New prop for removing from selected list

  isPlaying?: boolean; 
  showTitleOnHover?: boolean; 
  playIconForHover?: 'simple' | 'custom';

  showStaticTitleBelow?: boolean; 
  staticTitleTextColorClass?: string; 

  cardVariant?: 'default' | 'compact'; 
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  isSelected, 
  isFeatured = false, 
  onSelect, 
  // onMakeFeatured, // Not directly used if relying on order
  showActions = true,
  className = '',
  onClick,
  hideDetails = false,
  sharpCorners = false, 
  isAdmin = false, 
  customGifUrlValue = '',
  onSetCustomGif,
  isEditingCustomGif = false,
  onToggleEditCustomGif,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemoveFromReel,
  isPlaying = false,
  showTitleOnHover = false,
  playIconForHover = 'custom',
  showStaticTitleBelow = false,
  staticTitleTextColorClass = 'text-white',
  cardVariant = 'default'
}) => {
  const [internalCustomGifInput, setInternalCustomGifInput] = useState(customGifUrlValue);
  const isCompact = cardVariant === 'compact';
  const gifInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInternalCustomGifInput(customGifUrlValue);
  }, [customGifUrlValue]);

  useEffect(() => {
    if (isEditingCustomGif && gifInputRef.current) {
      gifInputRef.current.focus();
    }
  }, [isEditingCustomGif]);


  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggable && (e.target as HTMLElement).closest('.drag-handle-trigger')) {
      return; 
    }
    if ((e.target as HTMLElement).closest('.remove-from-reel-button')) {
      return;
    }
    if (onClick) {
      onClick();
    } else if (showActions && !isPlaying && !onRemoveFromReel) { // Only call onSelect if not in a "selected list" context
      onSelect(video.id);
    }
  };

  const handleCustomGifInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalCustomGifInput(e.target.value);
  };

  const handleSaveCustomGif = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    e.preventDefault(); // Prevent form submission
    if (onSetCustomGif && onToggleEditCustomGif) {
      onSetCustomGif(video.id, internalCustomGifInput);
      onToggleEditCustomGif(video.id); 
    }
  };

  const handleToggleInput = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent form submission
    if (onToggleEditCustomGif) {
      setInternalCustomGifInput(customGifUrlValue); 
      onToggleEditCustomGif(video.id);
    }
  };
  
  const getThumbnailContent = () => {
    // Prioritize custom GIF if available (especially for modal preview)
    if (customGifUrlValue && customGifUrlValue.trim()) {
      return (
        <img 
          src={customGifUrlValue} 
          alt={`Custom GIF for ${video.title}`} 
          className="w-full h-full object-cover object-center"
          title={video.title}
        />
      );
    }
    // Then check for Vimeo's video loop (MP4)
    if (video.videoLoopUrl) { 
      return (
        <video
          src={video.videoLoopUrl}
          poster={video.thumbnailUrl} // Static thumbnail as poster
          className="w-full h-full object-cover object-center"
          autoPlay
          loop
          muted
          playsInline
          aria-label={`Looping preview of ${video.title}`}
          title={video.title}
        />
      );
    }
    // Then check for explicitly set custom GIF from video data (might be redundant if customGifUrlValue is preferred)
    if (video.customThumbnailGifUrl) { 
      return (
        <img 
          src={video.customThumbnailGifUrl} 
          alt={`Custom GIF for ${video.title}`} 
          className="w-full h-full object-cover object-center"
          title={video.title}
        />
      );
    }
    // Fallback to Vimeo's static/GIF thumbnail
    return (
      <img 
        src={video.thumbnailUrl} 
        alt={video.title} 
        className="w-full h-full object-cover object-center"
        title={video.title}
      />
    );
  };

  const cardLayoutClasses = showStaticTitleBelow ? 'flex flex-col' : '';
  const cardBaseClasses = `relative group ${sharpCorners ? '' : 'rounded-lg'}`;
  const selectionClasses = isSelected && showActions && !hideDetails && !isPlaying && !onRemoveFromReel // Don't apply ring if it's in selected list
    ? 'ring-2 ring-brand-lime scale-105 z-10' 
    : 'ring-1 ring-transparent'; 
  const interactionClasses = onClick && !isPlaying ? 'cursor-pointer' : (showActions && !isPlaying && !onRemoveFromReel ? 'border border-brand-blue/10' : '');
  const draggableClasses = isDraggable ? 'cursor-grab active:cursor-grabbing' : '';
  const mainBgClass = showStaticTitleBelow ? '' : 'bg-black';

  const vimeoVideoId = video.videoUrl?.split('/').pop()?.split('?')[0];
  const vimeoManageUrl = vimeoVideoId ? `https://vimeo.com/manage/videos/${vimeoVideoId}` : '#';

  const vimeoEmbedParams = 'autoplay=1&background=0&byline=0&portrait=0&title=0&controls=1&fullscreen=1&muted=0'; // Ensure muted=0
  const videoEmbedUrl = `${video.videoUrl}${video.videoUrl.includes('?') ? '&' : ''}${vimeoEmbedParams}`;
  
  const detailsPaddingClass = isCompact ? 'p-1.5' : 'p-3';
  const detailsSpacingClass = isCompact ? 'space-y-0.5' : 'space-y-1';
  const titleTextSizeClass = isCompact ? 'text-xs' : 'text-sm';
  const durationTextSizeClass = 'text-xs'; 
  const buttonPtClass = isCompact ? 'pt-0.5' : 'pt-1';
  const buttonBaseClass = isCompact 
    ? `text-[10px] px-1.5 py-0.5 ${sharpCorners ? '' : 'rounded-sm'}` 
    : `text-xs px-2 py-1 ${sharpCorners ? '' : 'rounded-md'}`;
  const buttonIconSizeClass = isCompact ? 'w-3 h-3 mr-0.5' : 'w-3.5 h-3.5';
  const buttonTextHiddenClass = isCompact ? 'sr-only sm:not-sr-only' : ''; 

  const gifInputLabelTextSizeClass = isCompact ? 'text-[10px]' : 'text-xs';
  const gifInputLabelMbClass = isCompact ? 'mb-0.5' : 'mb-1';
  const gifInputPaddingClass = isCompact ? 'p-1' : 'p-1.5';
  const gifInputTextSizeClass = isCompact ? 'text-[10px]' : 'text-sm';
  const gifSaveButtonMtClass = isCompact ? 'mt-1' : 'mt-1.5';
  const gifSaveButtonTextSizeClass = isCompact ? 'text-[10px]' : 'text-xs';
  const gifSaveButtonPaddingClass = isCompact ? 'px-2 py-0.5' : 'px-2.5 py-1';

  // Updated font size and padding for static title below video card
  const staticTitleSize = "text-base sm:text-lg md:text-xl font-roboto-flex font-semibold leading-relaxed";
  const staticTitlePadding = "py-2 px-2 sm:py-2.5";


  return (
    <div 
      className={`${cardLayoutClasses} ${cardBaseClasses} ${selectionClasses} ${interactionClasses} ${draggableClasses} ${className} ${mainBgClass}`}
      onClick={handleCardClick}
      role={onClick ? 'button' : (isDraggable ? 'listitem' : undefined)}
      tabIndex={onClick || isDraggable ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      aria-label={onClick ? (isPlaying ? `Stop video: ${video.title}`: `Play video: ${video.title}`) : (isDraggable ? `Draggable: ${video.title}` : (isSelected ? `Deselect video: ${video.title}` : `Select video: ${video.title}`))}
      title={onClick && !isPlaying ? `Play: ${video.title}` : (isPlaying ? `Playing: ${video.title}` : (isDraggable ? `Drag to reorder: ${video.title}` : (showActions && !hideDetails ? (isSelected ? `Deselect: ${video.title}` : `Select: ${video.title}`) : video.title)))}
      draggable={isDraggable}
      onDragStart={isDraggable ? onDragStart : undefined}
      onDragOver={isDraggable ? onDragOver : undefined}
      onDrop={isDraggable ? onDrop : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
    >
      {isDraggable && showActions && !hideDetails && !isPlaying && !isEditingCustomGif && (
        <div 
            className="drag-handle-trigger absolute top-1/2 -left-3 transform -translate-y-1/2 z-30 p-1 bg-white/80 hover:bg-white rounded-full shadow-md cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()} 
            onTouchStart={(e) => e.stopPropagation()} // For touch devices if drag is implemented
        >
            <DragHandleIcon className="w-5 h-5 text-brand-blue" />
        </div>
      )}

      {onRemoveFromReel && showActions && !hideDetails && !isPlaying && (
        <button
            type="button" 
            onClick={(e) => {
                e.stopPropagation(); 
                onRemoveFromReel(video.id);
            }}
            className="remove-from-reel-button absolute top-1.5 right-1.5 z-30 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 active:bg-red-700 transition-colors shadow-md"
            title={`Remove "${video.title}" from reel`}
            aria-label={`Remove "${video.title}" from reel`}
        >
            <CloseIcon className="w-4 h-4" />
        </button>
      )}

      <div 
        className={`aspect-16/9 bg-black ${sharpCorners ? '' : 'overflow-hidden rounded-t-lg'} relative`}
      >
        {isPlaying ? (
            <iframe
                key={`${video.id}-playing`}
                src={videoEmbedUrl}
                width="100%"
                height="100%"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full border-0"
                title={video.title}
            ></iframe>
        ) : (
          <>
            {getThumbnailContent()}
            {onClick && (
                 <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 text-white">
                    {playIconForHover === 'simple' ? (
                        <PlayCircleIcon className="w-14 h-14 text-white/80 transition-transform transform group-hover:scale-110" />
                    ) : (
                        <CustomPlayIcon className="w-12 h-12 sm:w-14 sm:h-14 transition-transform transform group-hover:scale-110" />
                    )}
                </div>
            )}

            {showTitleOnHover && !showStaticTitleBelow && (
                <div className={`absolute top-0 left-0 right-0 ${isCompact ? 'p-1.5 sm:p-2' : 'p-2.5 sm:p-3'} bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none`}>
                    <h4 className={`text-white ${isCompact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-semibold line-clamp-2`} title={video.title}> 
                        {video.title}
                    </h4>
                </div>
            )}
            {onClick && !showTitleOnHover && !showStaticTitleBelow && (
                <div className={`absolute top-0 left-0 right-0 ${isCompact ? 'p-1' : 'p-2'} bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none`}>
                    <h4 className={`text-white ${isCompact ? 'text-xs' : 'text-xs sm:text-sm'} font-semibold truncate`} title={video.title}>
                        {video.title}
                    </h4>
                </div>
            )}
          </>
        )}
      </div>

      {showStaticTitleBelow && (
        <div className={`${staticTitlePadding} text-center ${staticTitleTextColorClass}`}>
          <h4 
            className={`${staticTitleSize} line-clamp-2`}
            title={video.title}
          >
            {video.title}
          </h4>
        </div>
      )}
      
      {showActions && !hideDetails && !isPlaying && ( 
        <>
        {isSelected && !onRemoveFromReel && ( // Checkmark only if not in "Selected for Reel" list (where remove button exists)
          <div 
            className={`absolute top-2 right-2 bg-white/80 hover:bg-white ${sharpCorners ? '' : 'rounded-full'} p-1 shadow-md transition-colors z-20`}
            title={isFeatured ? "Selected & Main Video" : "Selected"}
          >
            <CheckCircleIcon 
              className={`w-7 h-7 transition-colors ${isFeatured ? 'text-brand-lime' : 'text-brand-blue'}`} 
            />
          </div>
        )}

        {isFeatured && ( // Star always shows if featured, regardless of list context
            <div
                className={`absolute top-2 left-2 bg-white/80 ${sharpCorners ? '' : 'rounded-full'} p-1 shadow-md z-20`}
                title="Main Video (Cover)"
                aria-label="This is the main/cover video"
            >
                <StarIconSolid className="w-7 h-7 text-brand-lime fill-brand-lime" />
            </div>
        )}
        </>
      )}

      {!hideDetails && !isPlaying && ( 
        <div className={`${detailsPaddingClass} ${detailsSpacingClass} bg-brand-pink ${sharpCorners ? '' : 'rounded-b-lg'} ${isEditingCustomGif && showActions && isAdmin ? (isCompact ? 'pb-1' : 'pb-2') : ''}`}> 
          <h3 className={`${titleTextSizeClass} font-semibold text-brand-blue line-clamp-2`} title={video.title}>
            {video.title}
          </h3>
          <div className={`flex justify-between items-center ${durationTextSizeClass} text-brand-blue/80`}>
            <span>{video.duration}</span>
            {video.uploadDate && <span>{video.uploadDate}</span>}
          </div>

          {showActions && (
            <div className={`flex items-center space-x-2 ${buttonPtClass}`}>
              {isAdmin && onToggleEditCustomGif && (
                <button
                  type="button" // Important to prevent form submission
                  onClick={handleToggleInput}
                  className={`group ${buttonBaseClass} bg-brand-blue text-white font-semibold hover:bg-brand-lime hover:text-brand-blue transition-colors text-center flex items-center space-x-1 flex-grow justify-center`}
                  title={isEditingCustomGif ? "Cancel GIF Edit" : "Set Custom GIF Thumbnail"}
                >
                  <PhotoIcon className={`${buttonIconSizeClass} text-white group-hover:text-brand-lime`} />
                  <span className={`${buttonTextHiddenClass} text-white group-hover:text-brand-blue`}>{isEditingCustomGif ? 'Cancel GIF' : 'Set Custom GIF'}</span>
                </button>
              )}
              {vimeoVideoId && (
                <a
                  href={vimeoManageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`group ${buttonBaseClass} bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors text-center flex items-center space-x-1 flex-grow justify-center`}
                  title="View/Edit on Vimeo (opens new tab)"
                >
                  <ExternalLinkIcon className={`${buttonIconSizeClass} text-white`} />
                  <span className={`${buttonTextHiddenClass} text-white`}>Vimeo</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}
      
      {showActions && isAdmin && isEditingCustomGif && onSetCustomGif && !hideDetails && !isPlaying && ( 
        <div className={`${detailsPaddingClass} ${isCompact ? 'pt-0.5' : 'pt-1'} border-t border-brand-blue/10 bg-brand-pink ${sharpCorners ? '' : 'rounded-b-lg'}`}>
          <label htmlFor={`custom-gif-${video.id}`} className={`${gifInputLabelTextSizeClass} font-medium text-brand-blue/90 ${gifInputLabelMbClass} block`}>Custom GIF URL:</label>
          <input
            ref={gifInputRef}
            type="url"
            id={`custom-gif-${video.id}`}
            value={internalCustomGifInput}
            onChange={handleCustomGifInputChange}
            onClick={(e) => e.stopPropagation()} 
            placeholder="https://example.com/my.gif"
            className={`w-full ${gifInputPaddingClass} border border-brand-blue/40 ${sharpCorners ? '' : 'rounded-md'} ${gifInputTextSizeClass} focus:ring-1 focus:ring-brand-blue outline-none bg-transparent focus:bg-brand-pink/20 text-brand-blue placeholder-brand-blue/50`}
            title="Enter URL for custom GIF thumbnail"
          />
          <button
            type="button" // Important to prevent form submission
            onClick={handleSaveCustomGif}
            className={`${gifSaveButtonMtClass} ${gifSaveButtonTextSizeClass} bg-brand-blue text-white font-semibold ${gifSaveButtonPaddingClass} ${sharpCorners ? '' : 'rounded-md'} hover:bg-brand-lime hover:text-brand-blue transition-colors w-full`}
            title="Save Custom GIF URL"
          >
            Save GIF URL
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCard;