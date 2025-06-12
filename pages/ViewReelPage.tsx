

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Showreel, VimeoVideo, ShowreelDesignStyle } from '../types';
import VideoCard from '../components/VideoCard'; 
import { ShareIcon } from '../components/icons/ShareIcon';
import { EditIcon } from '../components/icons/EditIcon';
import ShareModal from '../components/ShareModal'; 
import { InstagramIcon } from '../components/icons/InstagramIcon';
import { LinkedInIcon } from '../components/icons/LinkedInIcon';
import { designStyles, getDesignStyleById, DesignStyle, DEFAULT_DESIGN_STYLE_ID } from '../designStyles'; 
import { ABOUT_HOBBY_CONTENT_KEY, DEFAULT_ABOUT_HOBBY_TEXT, ABOUT_HOBBY_GIF_URL_KEY, DEFAULT_ABOUT_HOBBY_GIF_URL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import useLocalStorage from '../hooks/useLocalStorage'; 
import { LoadingSpinnerIcon } from '../components/icons/LoadingSpinnerIcon';

const STICKY_HEADER_THRESHOLD = 80; 

// Responsive spacing constants (largely kept, specific element margins adjusted directly)
const MAIN_TITLE_AREA_BOTTOM_PADDING = "pb-4 sm:pb-7 md:pb-10 lg:pb-14 xl:pb-16"; // From previous request
const VIDEO_GRID_SECTION_TOP_MARGIN = "mt-6 sm:mt-10 md:mt-14 lg:mt-20 xl:mt-24";
const VIDEO_GRID_SECTION_BOTTOM_PADDING = "pb-6 sm:pb-8 md:pb-10 lg:pb-12";

const DEFAULT_CONTENT_SECTION_BOTTOM_MARGIN = "mb-10 sm:mb-14 md:mb-20 lg:mb-24";


const parseDirectorTitleForDisplay = (fullTitleInput: string | undefined): { line1: string; line2: string; line3: string } => {
  const defaultTitleForEmpty = 'Director'; 
  const defaultTitleForAboutOnly = 'This Section';

  if (!fullTitleInput || !fullTitleInput.trim()) {
    return { line1: 'About', line2: defaultTitleForEmpty.toUpperCase(), line3: '' };
  }

  let nameContent = fullTitleInput.trim();
  const titleStartsWithAbout = nameContent.toLowerCase().startsWith('about ');

  if (titleStartsWithAbout) {
    nameContent = nameContent.substring(6).trim(); 
    if (!nameContent) { 
      return { line1: 'About', line2: defaultTitleForAboutOnly.toUpperCase(), line3: '' };
    }
  }

  const nameWords = nameContent.split(/\s+/).filter(w => w);
  if (nameWords.length === 0) { 
    return { line1: 'About', line2: defaultTitleForAboutOnly.toUpperCase(), line3: '' };
  }

  const firstName = nameWords[0];
  const restOfName = nameWords.slice(1).join(' ');

  let line2: string;
  let line3: string;

  if (firstName.length <= 5 && restOfName) { // For names like "Oskar Bård"
    line2 = `${firstName} ${restOfName}`.toUpperCase();
    line3 = '';
  } else { // For names like "Magnus Renfors" or single long names
    line2 = firstName.toUpperCase();
    line3 = restOfName.toUpperCase();
  }

  return { line1: 'About', line2: line2.trim(), line3: line3.trim() };
};


interface ViewReelPageProps {
  allShowreels: Showreel[];
  isGistView?: boolean;
}

const ViewReelPage: React.FC<ViewReelPageProps> = ({ allShowreels, isGistView = false }) => {
  const { reelId, gistId } = useParams<{ reelId?: string; gistId?: string }>();
  const [aboutHobbyStoredContent] = useLocalStorage<string>(ABOUT_HOBBY_CONTENT_KEY, DEFAULT_ABOUT_HOBBY_TEXT);
  const [aboutHobbyStoredGifUrl] = useLocalStorage<string>(ABOUT_HOBBY_GIF_URL_KEY, DEFAULT_ABOUT_HOBBY_GIF_URL);
  
  const [currentReel, setCurrentReel] = useState<Showreel | null>(null);
  const [isLoadingReel, setIsLoadingReel] = useState(true);
  const [reelError, setReelError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); 
  const [isScrolled, setIsScrolled] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  
  const [currentDesign, setCurrentDesign] = useState<DesignStyle>(getDesignStyleById(DEFAULT_DESIGN_STYLE_ID));
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const aboutHobbyContentToDisplay = useMemo(() => {
    return aboutHobbyStoredContent && aboutHobbyStoredContent.trim() ? aboutHobbyStoredContent : null;
  }, [aboutHobbyStoredContent]);

  const aboutHobbyGifUrlToDisplay = useMemo(() => {
    return aboutHobbyStoredGifUrl && aboutHobbyStoredGifUrl.trim() ? aboutHobbyStoredGifUrl : null;
  }, [aboutHobbyStoredGifUrl]);


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > STICKY_HEADER_THRESHOLD) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsLoadingReel(true);
    setReelError(null);
    setCurrentReel(null);
    setPlayingVideoId(null); 

    if (isGistView && gistId) {
      const fetchGistReel = async () => {
        try {
          const response = await fetch(`https://api.github.com/gists/${gistId}`);
          if (!response.ok) {
            if (response.status === 404) throw new Error('Showreel not found (Gist).');
            if (response.status === 403) throw new Error('Rate limit exceeded fetching Gist. Please try again later.');
            throw new Error(`Failed to fetch showreel data (Gist): ${response.statusText}`);
          }
          const gistData = await response.json();
          const fileKey = Object.keys(gistData.files).find(key => key.endsWith('.json'));
          if (!fileKey || !gistData.files[fileKey]?.content) {
            throw new Error('Showreel data format error in Gist.');
          }
          const reelData: Showreel = JSON.parse(gistData.files[fileKey].content);
          setCurrentReel(reelData);
          setCurrentDesign(getDesignStyleById(reelData.designStyle));
        } catch (error: any) {
          console.error("Error fetching Gist reel:", error);
          setReelError(error.message || 'Could not load showreel from shared link.');
        } finally {
          setIsLoadingReel(false);
        }
      };
      fetchGistReel();
    } else if (reelId) {
      const foundReel = allShowreels.find(r => r.id === reelId); 
      if (foundReel) {
        setCurrentReel(foundReel);
        setCurrentDesign(getDesignStyleById(foundReel.designStyle));
      } else {
        setReelError('Showreel not found in your current session.');
      }
      setIsLoadingReel(false);
    } else {
      setReelError('Invalid showreel identifier.');
      setIsLoadingReel(false);
    }
  }, [reelId, gistId, isGistView, allShowreels]);


  const allVideosInReel = useMemo(() => {
    if (!currentReel) return [];
    return [currentReel.featuredVideo, ...currentReel.otherVideos];
  }, [currentReel]);

  const parsedAboutDirectorTitle = useMemo(() => 
    parseDirectorTitleForDisplay(currentReel?.aboutDirectorTitle), 
  [currentReel?.aboutDirectorTitle]);

  const getFeaturedImageUrlForShare = (): string => {
    if (!currentReel) return '';
    const featured = currentReel.featuredVideo;
    if (featured.customThumbnailGifUrl) return featured.customThumbnailGifUrl;
    if (featured.videoLoopUrl && featured.videoLoopUrl.toLowerCase().endsWith('.gif')) return featured.videoLoopUrl;
    return featured.thumbnailUrl; 
  };

  const handleOpenShareModal = () => {
    if (currentReel) {
      setIsShareModalOpen(true);
    }
  };

  const handleVideoCardClick = (videoId: string) => {
    setPlayingVideoId(currentId => currentId === videoId ? null : videoId);
  };
  
  const titleFontFamily = "font-poppins font-black";
  const mainLogoHeightClasses = "h-[clamp(6.86rem,15.68vw,10.78rem)]"; 
  const logoMarginBottomClasses = "mb-1 sm:mb-2 md:mb-2 lg:mb-3"; 
  
  const descriptionSizeClasses = "text-base sm:text-lg md:text-xl font-roboto-flex font-semibold";
  const descriptionSpacingClasses = "mt-1 mb-3"; 

  const aboutSectionTitleSizeClasses = "text-[clamp(3rem,10vw,6.5rem)]"; 

  const aboutSectionBodyTextSizeClasses = "text-base sm:text-lg md:text-xl font-roboto-flex font-semibold";
  const aboutSectionBodySpacingClasses = "mt-4 sm:mt-6 md:mt-8 pb-6";
  
  const customInfoTitleTranslateYClasses = "-translate-y-10 sm:-translate-y-14 md:-translate-y-20 lg:-translate-y-24 xl:-translate-y-28";


  const displayTitle = currentReel 
    ? (currentReel.directorName !== undefined && currentReel.brandName !== undefined 
        ? `${currentReel.directorName} X ${currentReel.brandName}` 
        : (currentReel as any).title || "Untitled Showreel") 
    : "Untitled Showreel";
  
  const titleForTooltip = currentReel
    ? (currentReel.directorName !== undefined && currentReel.brandName !== undefined
        ? `${currentReel.directorName} X ${currentReel.brandName}`
        : (currentReel as any).title || "Showreel details unavailable")
    : "Showreel details unavailable";


  if (isLoadingReel) {
    return (
      <div className={`${currentDesign.pageBgColor} min-h-screen flex flex-col items-center justify-center`}>
        <LoadingSpinnerIcon className={`w-12 h-12 mb-4 ${currentDesign.primaryTextColor}`} />
        <h2 className={`text-2xl font-bold ${currentDesign.primaryTextColor}`}>Loading Showreel...</h2>
      </div>
    );
  }

  if (reelError) {
    return (
      <div className={`${currentDesign.pageBgColor} min-h-screen flex flex-col items-center justify-center text-center p-4`}>
        <h2 className="text-2xl font-bold text-red-500">Error Loading Showreel</h2>
        <p className={`${currentDesign.secondaryTextColor} mt-2`}>
          {reelError}
        </p>
        <Link to="/" className={`mt-4 ${currentDesign.primaryTextColor} ${currentDesign.hoverTextColor} hover:underline`}>Go to Homepage</Link>
      </div>
    );
  }
  
  if (!currentReel) { 
    return (
      <div className={`${currentDesign.pageBgColor} min-h-screen flex flex-col items-center justify-center text-center p-4`}>
        <h2 className="text-2xl font-bold text-red-500">Showreel Not Found</h2>
        <p className={`${currentDesign.secondaryTextColor} mt-2`}>
          This showreel may have been moved, deleted, or the link is incorrect.
        </p>
        <Link to="/" className={`mt-4 ${currentDesign.primaryTextColor} ${currentDesign.hoverTextColor} hover:underline`}>Go to Homepage</Link>
      </div>
    );
  }
  
  const reelUrlForSharing = isGistView && gistId ? `${window.location.origin}${window.location.pathname}#/reel/gist/${gistId}` : `${window.location.origin}${window.location.pathname}#/reel/${reelId}`;

  const renderAboutDirectorTitle = (line1: string, line2: string, line3: string, textColorClass: string) => (
    <>
      {line1 && (
        <h2 className={`${titleFontFamily} ${aboutSectionTitleSizeClasses} ${textColorClass} whitespace-nowrap break-words leading-none`}>
          {line1}
        </h2>
      )}
      {line2 && (
        <h2 className={`${titleFontFamily} ${aboutSectionTitleSizeClasses} ${textColorClass} whitespace-nowrap mt-0 break-words leading-none`}>
          {line2}
        </h2>
      )}
      {line3 && (
        <h2 className={`${titleFontFamily} ${aboutSectionTitleSizeClasses} ${textColorClass} whitespace-nowrap mt-0 break-words leading-none`}>
          {line3}
        </h2>
      )}
    </>
  );

  const renderFixedAboutHobbyTitle = (textColorClass: string) => (
    <h2 className={`${titleFontFamily} text-[clamp(3.2rem,10.5vw,6.8rem)] ${textColorClass} whitespace-nowrap break-words leading-[1.05]`}>
      About HOBBY
    </h2>
  );
  
  const customInfoSectionIsVisible = currentReel && (currentReel.aboutDirectorTitle || currentReel.aboutDirectorDescription || currentReel.aboutDirectorGifUrl);

  const canEditReel = !isGistView && currentUser && currentReel; 

  return (
    <div className={`${currentDesign.pageBgColor} min-h-screen flex flex-col`}> 
      <header 
        className={`fixed top-0 left-0 right-0 z-50 ${currentDesign.pageBgColor}/95 backdrop-blur-sm transition-all duration-300 ease-in-out 
                    ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}
        aria-hidden={!isScrolled}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-1.5 group" title="Go to Homepage">
            <img 
              src={currentDesign.stickySkullUrl} 
              alt="REEL Skull Logo" 
              className="w-7 h-7 object-contain group-hover:opacity-80 transition-opacity"
            />
            <h1 className={`text-xl font-bold ${currentDesign.primaryTextColor} group-hover:opacity-80 transition-opacity`}>
              REEL
            </h1>
          </Link>
          
          <div className="flex items-center space-x-2">
            {canEditReel && reelId && (
              <Link
                to={`/edit/${reelId}`}
                className={`group bg-transparent ${currentDesign.primaryTextColor} p-2 rounded-md ${currentDesign.hoverTextColor} transition-all flex items-center justify-center`}
                aria-label="Edit this showreel"
                title="Edit Showreel"
              >
                <EditIcon className="w-5 h-5" />
              </Link>
            )}
            <button 
              onClick={handleOpenShareModal} 
              className={`group bg-transparent ${currentDesign.primaryTextColor} p-2 rounded-md ${currentDesign.hoverTextColor} transition-all flex items-center justify-center`}
              aria-label="Share this showreel"
              title="Share Showreel"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-grow container mx-auto px-4 pt-8 sm:pt-12">
        <div 
          className={`text-center transition-all duration-500 ease-in-out transform ${logoMarginBottomClasses}
                      ${isScrolled ? 'opacity-0 max-h-0 py-0 mb-0 scale-90 pointer-events-none' : 'opacity-100 max-h-screen py-3 sm:py-4 scale-100'}`}
          aria-hidden={isScrolled}
        >
          <img 
              src={currentDesign.mainLogoUrl} 
              alt="Hobby Reel Brand Logo" 
              className={`mx-auto ${mainLogoHeightClasses} transform -rotate-[4deg]`}
          />
        </div>
        
        <div className={`text-center pt-0 ${MAIN_TITLE_AREA_BOTTOM_PADDING}`}> 
          <h1 
            className={`${titleFontFamily} ${currentDesign.primaryTextColor} tracking-tight px-1 text-center break-words leading-tight`}
            title={titleForTooltip}
          >
            {currentReel.directorName !== undefined && currentReel.brandName !== undefined ? (
              <>
                <span className="block text-[clamp(3rem,10vw,6.5rem)]">{currentReel.directorName}</span>
                <span 
                  className={`block font-roboto-flex font-semibold text-[clamp(0.75rem,2vw,1.25rem)] ${currentDesign.primaryTextColor} my-0 leading-tight`}
                >
                  X
                </span>
                <span className="block text-[clamp(3rem,10vw,6.5rem)]">{currentReel.brandName}</span>
              </>
            ) : (
              <span className="text-[clamp(3rem,10vw,6.5rem)]">{(currentReel as any).title || "Untitled Showreel"}</span>
            )}
          </h1>
          {currentReel.description && (
            <p className={`w-full max-w-[750px] mx-auto ${currentDesign.primaryTextColor} ${descriptionSpacingClasses} ${descriptionSizeClasses} leading-snug whitespace-pre-line px-1 text-center`}>
              {currentReel.description}
            </p>
          )}
        </div>
        
        {allVideosInReel.length > 0 && (
           <section 
            aria-labelledby="videos-in-reel-heading" 
            className={`${VIDEO_GRID_SECTION_TOP_MARGIN} ${VIDEO_GRID_SECTION_BOTTOM_PADDING}`}
          >
            <h2 id="videos-in-reel-heading" className="sr-only">Videos in this reel</h2>
            <div className={`grid ${currentDesign.videoGridCols} gap-4 sm:gap-5 md:gap-6`}> 
            {allVideosInReel.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                isSelected={false} 
                onSelect={() => {}} 
                showActions={false} 
                onClick={() => handleVideoCardClick(video.id)}
                hideDetails={true} 
                sharpCorners={true}
                className={`w-full overflow-hidden cursor-pointer ${currentDesign.videoCardTextColorClass}`} 
                isPlaying={playingVideoId === video.id}
                showTitleOnHover={false} 
                playIconForHover='custom' 
                showStaticTitleBelow={true} 
                staticTitleTextColorClass={currentDesign.primaryTextColor} 
              />
            ))}
            </div>
          </section>
        )}
        
        {allVideosInReel.length === 0 && currentReel && ( 
          <p className={`${currentDesign.secondaryTextColor} text-center py-2 pb-4`}>This showreel appears to be empty.</p>
        )}
      </div>

      {customInfoSectionIsVisible && (
        <section 
          aria-label={currentReel.aboutDirectorTitle || "Custom Information"}
          className={`
            mt-16 sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32 
            ${DEFAULT_CONTENT_SECTION_BOTTOM_MARGIN}
          `}
        >
          <div className="container mx-auto px-4">
            <div> 
              {currentReel.aboutDirectorGifUrl ? (
                <div className="relative"> 
                  {(parsedAboutDirectorTitle.line1 || parsedAboutDirectorTitle.line2 || parsedAboutDirectorTitle.line3) && (
                    <div
                      className={`absolute left-0 top-0 transform -rotate-[4deg] origin-top-left z-10 
                                  ${customInfoTitleTranslateYClasses}
                                  `}
                    >
                      {renderAboutDirectorTitle(parsedAboutDirectorTitle.line1, parsedAboutDirectorTitle.line2, parsedAboutDirectorTitle.line3, currentDesign.primaryTextColor)}
                    </div>
                  )}
                  
                  <div className="relative w-full aspect-16/9 mb-2 md:mb-4 mt-6 md:mt-8"> 
                    <img 
                      src={currentReel.aboutDirectorGifUrl} 
                      alt={currentReel.aboutDirectorTitle || 'Custom section image/GIF'} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                </div>
              ) : (
                (parsedAboutDirectorTitle.line1 || parsedAboutDirectorTitle.line2 || parsedAboutDirectorTitle.line3) && (
                  <div className={`w-max mx-auto transform -rotate-[4deg] origin-top-left mb-4 sm:mb-6 md:mb-8`}>
                    {renderAboutDirectorTitle(parsedAboutDirectorTitle.line1, parsedAboutDirectorTitle.line2, parsedAboutDirectorTitle.line3, currentDesign.primaryTextColor)}
                  </div>
                )
              )}
            </div>
            
            {currentReel.aboutDirectorDescription && (
              <div className={`mx-auto max-w-3xl ${currentReel.aboutDirectorGifUrl ? 'mt-4 sm:mt-6' : 'mt-4 sm:mt-6 md:mt-8'} pb-6`}>
                <p 
                  className={`${aboutSectionBodyTextSizeClasses} leading-relaxed whitespace-pre-line ${currentDesign.primaryTextColor} text-left`}
                >
                  {currentReel.aboutDirectorDescription}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {aboutHobbyContentToDisplay && (
        <section
          aria-label="About HOBBY"
          className={`mt-6 sm:mt-8 md:mt-10 lg:mt-12 ${DEFAULT_CONTENT_SECTION_BOTTOM_MARGIN}`} 
        >
          <div className="container mx-auto px-4">
            <div className={`w-max mx-auto transform rotate-[4deg] origin-top-left mb-6 sm:mb-8 md:mb-10`}>
              {renderFixedAboutHobbyTitle(currentDesign.primaryTextColor)}
            </div>

            {aboutHobbyGifUrlToDisplay && (
              <div className="relative w-full aspect-16/9"> 
                <img 
                  src={aboutHobbyGifUrlToDisplay} 
                  alt={'About HOBBY illustration'} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
            
            <div className={`mx-auto max-w-3xl ${aboutSectionBodySpacingClasses}`}>
              <p 
                className={`${aboutSectionBodyTextSizeClasses} leading-relaxed whitespace-pre-line ${currentDesign.primaryTextColor} text-left`}
              >
                {aboutHobbyContentToDisplay}
              </p>
            </div>
          </div>
        </section>
      )}


      {isShareModalOpen && currentReel && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          reelTitle={displayTitle}
          reelDescription={currentReel.description}
          reelUrl={reelUrlForSharing} 
          featuredVideoImageUrl={getFeaturedImageUrlForShare()}
          designStyle={currentDesign}
          reelData={currentReel}
          isGistView={isGistView}
        />
      )}

      <footer className={`mt-auto py-6 sm:py-8 border-t ${currentDesign.primaryTextColor === 'text-brand-magenta' ? 'border-brand-magenta/20' : 'border-brand-blue/20'} ${currentDesign.pageBgColor} ${currentDesign.primaryTextColor}`}>
        <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-4 sm:space-y-5">
          
          <div className="space-y-1.5">
            <a 
              href="mailto:talk@hobbyfilm.com" 
              className={`block text-xs sm:text-sm ${currentDesign.primaryTextColor} ${currentDesign.hoverTextColor} transition-colors`}
              title="Email Hobby Film"
            >
              talk@hobbyfilm.com
            </a>
            <p className="text-xs sm:text-sm leading-relaxed">
              <strong className="font-semibold">Europe:</strong> AB, Box 2403, 116 74 Stockholm, Sweden
            </p>
            <p className="text-xs sm:text-sm leading-relaxed">
              <strong className="font-semibold">USA:</strong> 3415 S. Sepulveda Blvd. Ste. 1100 PMB 0361, CA 90034
            </p>
          </div>
          
          <div className="flex justify-center space-x-5 sm:space-x-6">
            <a href="https://www.instagram.com/hobby.film/" target="_blank" rel="noopener noreferrer" title="Hobby Film on Instagram" className={`${currentDesign.primaryTextColor} ${currentDesign.hoverTextColor} transition-colors`}>
              <InstagramIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
            <a href="https://www.linkedin.com/company/hobbyfilm" target="_blank" rel="noopener noreferrer" title="Hobby Film on LinkedIn" className={`${currentDesign.primaryTextColor} ${currentDesign.hoverTextColor} transition-colors`}>
              <LinkedInIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
            <a href="https://hobbyfilm.com/" target="_blank" rel="noopener noreferrer" title="Hobby Film Website" className={`inline-block ${currentDesign.primaryTextColor} ${currentDesign.hoverTextColor} transition-colors`}> 
              <img 
                src={currentDesign.stickySkullUrl} 
                alt="Hobby Film Skull Logo"
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ViewReelPage;
