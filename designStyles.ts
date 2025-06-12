import { ShowreelDesignStyle } from './types';

export interface DesignStyle {
  id: ShowreelDesignStyle; 
  name: string; 
  mainLogoUrl: string;
  stickySkullUrl: string;
  pageBgColor: string; 
  primaryTextColor: string; 
  secondaryTextColor: string; 
  hoverTextColor: string; 
  videoGridCols: string; 
  videoCardTextColorClass: string; 
}

// Set Design 1 ("Blue on Light Pink") as the default
export const DEFAULT_DESIGN_STYLE_ID: ShowreelDesignStyle = 'blue_on_light_pink';

export const designStyles: DesignStyle[] = [
  {
    id: 'blue_on_light_pink',
    name: 'Blue on Light Pink',
    mainLogoUrl: "https://i.postimg.cc/sxGLKJ6w/blue-large.png",
    stickySkullUrl: "https://i.postimg.cc/Nf3thKRK/blue-skull-small.png",
    pageBgColor: 'bg-brand-pink',
    primaryTextColor: 'text-brand-blue',
    secondaryTextColor: 'text-brand-blue/90',
    hoverTextColor: 'hover:text-brand-lime', // Using existing lime for hover
    videoGridCols: 'grid-cols-1', // Consistent single column
    videoCardTextColorClass: 'text-brand-blue',
  },
  {
    id: 'neon_yellow_on_green',
    name: 'Neon Yellow on Green',
    mainLogoUrl: "https://i.postimg.cc/2SxC4zB3/neon-yellow-large.png",
    stickySkullUrl: "https://i.postimg.cc/1zH1NM2F/neon-yellow-skull-small.png",
    pageBgColor: 'bg-brand-neon-green',
    primaryTextColor: 'text-brand-neon-yellow',
    secondaryTextColor: 'text-black/80', // Adjusted for readability
    hoverTextColor: 'hover:text-black',   // Adjusted for readability
    videoGridCols: 'grid-cols-1', // Consistent single column
    videoCardTextColorClass: 'text-brand-neon-yellow',
  },
  {
    id: 'medium_pink_on_rose',
    name: 'Medium Pink on Rose',
    mainLogoUrl: "https://i.postimg.cc/15wm30mG/Medium-pink-large.png",
    stickySkullUrl: "https://i.postimg.cc/6QwN3Fjw/medium-pink-skull-small.png",
    pageBgColor: 'bg-brand-rose-pink',
    primaryTextColor: 'text-brand-magenta',
    secondaryTextColor: 'text-brand-magenta/90',
    hoverTextColor: 'hover:text-brand-blue', // Contrasting hover
    videoGridCols: 'grid-cols-1', // Consistent single column
    videoCardTextColorClass: 'text-brand-magenta',
  },
  {
    id: 'cream_on_neon_pink',
    name: 'Cream on Neon Pink',
    mainLogoUrl: "https://i.postimg.cc/jqWqG0Bk/cream-large.png",
    stickySkullUrl: "https://i.postimg.cc/wv4KwM6T/cream-skull-small.png",
    pageBgColor: 'bg-brand-neon-pink-bg',
    primaryTextColor: 'text-brand-rose-pink', // This is the "Cream" color text
    secondaryTextColor: 'text-black/80', // Adjusted for readability
    hoverTextColor: 'hover:text-black',   // Adjusted for readability
    videoGridCols: 'grid-cols-1', // Consistent single column
    videoCardTextColorClass: 'text-brand-rose-pink',
  },
];

export const getDesignStyleById = (id: ShowreelDesignStyle | undefined | null): DesignStyle => {
  if (!id) return designStyles.find(style => style.id === DEFAULT_DESIGN_STYLE_ID) || designStyles[0];
  const foundStyle = designStyles.find(style => style.id === id);
  return foundStyle || designStyles.find(style => style.id === DEFAULT_DESIGN_STYLE_ID) || designStyles[0];
};