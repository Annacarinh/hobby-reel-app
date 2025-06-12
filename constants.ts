import { VimeoVideo } from './types';

export const MOCK_VIDEOS: VimeoVideo[] = [
  {
    id: 'vid001',
    title: 'Future heros for Allianz Direct (MP4 Loop)',
    thumbnailUrl: 'https://videoapi-muybridge.vimeocdn.com/animated-thumbnails/image/45f07de3-de68-4662-b1ad-de5e9f323a67.gif?ClientID=sulu&Date=1748360218&Signature=4d27177351809010b69fd7a216fd91a1a9b5a891', // This GIF will act as poster
    videoLoopUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', // Added MP4 loop
    videoUrl: 'https://player.vimeo.com/video/590354610',
    duration: '3:15'
  },
  {
    id: 'vid002',
    title: 'Pretzel Horse for Lunchables (GIF Thumbnail)',
    thumbnailUrl: 'https://videoapi-muybridge.vimeocdn.com/animated-thumbnails/image/f70e063e-1833-4de6-8b98-b8ab4075207f.gif?ClientID=sulu&Date=1748360324&Signature=660c888bd131bd7defa7abcf6dc5e18782adf46c', // This is a GIF, no videoLoopUrl
    videoUrl: 'https://player.vimeo.com/video/560040070',
    duration: '1:45'
  },
  { id: 'vid003', title: 'Client Testimonials Reel', thumbnailUrl: 'https://placehold.co/320x180/eec0dd/162bf4.gif?text=Testimonials', videoUrl: 'https://player.vimeo.com/video/583973913', duration: '2:30' },
  { id: 'vid004', title: 'Animated Explainer Video', thumbnailUrl: 'https://placehold.co/320x180/eec0dd/162bf4.gif?text=Explainer', videoUrl: 'https://player.vimeo.com/video/398980900', duration: '1:10' },
  { id: 'vid005', title: 'Behind the Scenes: Our Process', thumbnailUrl: 'https://placehold.co/320x180/eec0dd/162bf4.gif?text=BTS+Process', videoUrl: 'https://player.vimeo.com/video/451060985', duration: '4:05' },
  { id: 'vid006', title: 'Corporate Event Highlights', thumbnailUrl: 'https://placehold.co/320x180/eec0dd/162bf4.gif?text=Event', videoUrl: 'https://player.vimeo.com/video/387600974', duration: '2:50' },
  { id: 'vid007', title: 'Short Film Teaser', thumbnailUrl: 'https://placehold.co/320x180/eec0dd/162bf4.gif?text=Teaser', videoUrl: 'https://player.vimeo.com/video/474959701', duration: '0:55' },
  { id: 'vid008', title: 'Music Video Montage', thumbnailUrl: 'https://placehold.co/320x180/eec0dd/162bf4.gif?text=Music+Montage', videoUrl: 'https://player.vimeo.com/video/413796352', duration: '3:30' },
  { id: 'vid009', title: 'Real Estate Virtual Tour', thumbnailUrl: 'https://placehold.co/320x180/eec0dd/162bf4.gif?text=Real+Estate', videoUrl: 'https://player.vimeo.com/video/492715300', duration: '2:15' },
  { id: 'vid010', title: 'Fitness Workout Routine', thumbnailUrl: 'https://placehold.co/320x180/eec0dd/162bf4.gif?text=Fitness', videoUrl: 'https://player.vimeo.com/video/430220005', duration: '5:00' },
];

export const ABOUT_HOBBY_CONTENT_KEY = 'aboutHobbyContent_v1';
export const ABOUT_HOBBY_GIF_URL_KEY = 'aboutHobbyGifUrl_v1';

export const DEFAULT_ABOUT_HOBBY_TEXT = `HOBBY is a creative production company with offices in Stockholm, Amsterdam, and Los Angeles.

We have created films for brands like LEGO, Carlsberg, Coca-Cola, Pepsi, Milka, IKEA, H&M, Volvo, Vodafone and Sennheiser, working with our friends at agencies like 72andSunny, Wieden+Kennedy, Saatchi & Saatchi, Forsman & Bodenfors and more.

Why are we called HOBBY? Because we’re named after the passion we all have for everything that isn’t work. Because, for us, making films isn’t work. We love what we do, the people we meet and the things that we make.`;

export const DEFAULT_ABOUT_HOBBY_GIF_URL = 'https://videoapi-muybridge.vimeocdn.com/animated-thumbnails/image/5d36e0c4-233f-4fac-acc2-6e7b79e60a74.gif?ClientID=sulu&Date=1748619286&Signature=7d7698b69d6074a5c5ec76e91a289f719552bab0';

export const ADMIN_EMAIL = 'hema@hobbyfilm.com';
export const DEFAULT_ADMIN_PASSWORD_PROTOTYPE = 'fdgd'; // Highly insecure, for prototype only! Updated to match error log.