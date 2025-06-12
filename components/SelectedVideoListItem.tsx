import React from 'react';
import { VimeoVideo } from '../types';
import { DragHandleIcon } from './icons/DragHandleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface SelectedVideoListItemProps {
  video: VimeoVideo;
  isFeatured: boolean;
  onRemove: (videoId: string) => void;
  onPreview: (video: VimeoVideo) => void;
  // Desktop drag-and-drop
  onDragStart: (e: React.DragEvent<HTMLDivElement>, videoId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, videoId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  // Mobile reordering
  onMoveUp: (videoId: string) => void;
  onMoveDown: (videoId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

const SelectedVideoListItem: React.FC<SelectedVideoListItemProps> = ({
  video,
  isFeatured,
  onRemove,
  onPreview,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  return (
    <div
      draggable // Draggable attribute for desktop
      onDragStart={(e) => onDragStart(e, video.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, video.id)}
      onDragEnd={onDragEnd}
      className="flex items-center p-3 border-b border-brand-blue/10 bg-brand-pink/5 hover:bg-brand-pink/20 md:cursor-grab md:active:cursor-grabbing transition-colors"
      role="listitem"
      aria-label={`Selected video: ${video.title}. ${isFeatured ? 'This is the featured video.' : ''} ${'Drag or use arrows to reorder.'}`}
    >
      {/* Desktop Drag Handle */}
      <div 
        className="drag-handle-trigger p-1 mr-2 text-brand-blue/50 hover:text-brand-blue hidden md:block" // Hidden on mobile
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()} 
      >
        <DragHandleIcon className="w-5 h-5" />
      </div>

      {/* Mobile Move Buttons */}
      <div className="flex flex-col mr-2 md:hidden"> {/* Shown only on mobile */}
        <button
          type="button"
          onClick={() => onMoveUp(video.id)}
          disabled={isFirst}
          className="p-1 text-brand-blue/60 hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed"
          title="Move Up"
          aria-label="Move video up in the list"
        >
          <ChevronUpIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(video.id)}
          disabled={isLast}
          className="p-1 text-brand-blue/60 hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed"
          title="Move Down"
          aria-label="Move video down in the list"
        >
          <ChevronDownIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow mr-2 overflow-hidden">
        <h4
          className="font-semibold text-brand-blue line-clamp-1"
          title={video.title}
        >
          {video.title}
        </h4>
        <p className="text-xs text-brand-blue/70">
          {video.duration}
          {video.uploadDate && ` • ${video.uploadDate}`}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center space-x-1 sm:space-x-1.5">
        <button
          type="button"
          onClick={() => onPreview(video)}
          className="group p-1.5 sm:p-2 rounded-md hover:bg-brand-blue/10 focus:outline-none focus:ring-1 focus:ring-brand-lime"
          title={`Preview "${video.title}"`}
          aria-label={`Preview video: ${video.title}`}
        >
          <EyeIcon className="w-5 h-5 text-brand-blue/70 group-hover:text-brand-blue transition-colors" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(video.id)}
          className="group p-1.5 sm:p-2 rounded-md hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-500"
          title={`Remove "${video.title}" from reel`}
          aria-label={`Remove video from reel: ${video.title}`}
        >
          <TrashIcon className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" />
        </button>
      </div>
    </div>
  );
};

export default SelectedVideoListItem;