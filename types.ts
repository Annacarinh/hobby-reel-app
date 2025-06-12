export interface VimeoVideo {
  id: string;
  title: string; 
  thumbnailUrl: string; 
  videoLoopUrl?: string; 
  customThumbnailGifUrl?: string; 
  videoUrl: string; 
  duration: string; 
  uploadDate?: string; // Added for video upload date
  privacy?: string; // Added to store video privacy status (e.g., 'anybody', 'nobody', 'unlisted')
}

export type UserRole = 'admin' | 'rep';

export interface User {
  id: string; 
  name: string; 
  email: string; 
  passwordHash: string; 
  role: UserRole;
}

// Using string for flexibility, specific known IDs are managed in designStyles.ts
export type ShowreelDesignStyle = string; 

export interface Showreel {
  id: string;
  userId: string; 
  directorName: string; // New field
  brandName: string;    // New field
  description?: string; 
  featuredVideo: VimeoVideo; 
  otherVideos: VimeoVideo[];  
  createdAt: string; 
  designStyle: ShowreelDesignStyle; 
  aboutDirectorTitle?: string;
  aboutDirectorDescription?: string;
  aboutDirectorGifUrl?: string;
}