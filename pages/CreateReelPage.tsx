import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Showreel, VimeoVideo, ShowreelDesignStyle } from '../types';
import { MOCK_VIDEOS } from '../constants';
import VideoCard from '../components/VideoCard';
import VideoListItem from '../components/VideoListItem';
import VideoListItemSkeleton from '../components/VideoListItemSkeleton';
import SelectedVideoListItem from '../components/SelectedVideoListItem';
import DesignStyleCard from '../components/DesignStyleCard';
import useDebounce from '../hooks/useDebounce';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { SaveIcon } from '../components/icons/SaveIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserVimeoVideos, FetchUserVideosOptions, FetchUserVideosResponse } from '../services/vimeo';
import { SearchIcon } from '../components/icons/SearchIcon';
import { LoadingSpinnerIcon } from '../components/icons/LoadingSpinnerIcon';
import { designStyles, DEFAULT_DESIGN_STYLE_ID } from '../designStyles';

const VIMEO_TOKEN_KEY = 'vimeo_access_token_PROTOTYPE'; 
const INITIAL_LOAD_COUNT = 7; 
const VIDEOS_PER_PAGE = 5;    
const SKELETONS_ON_LOAD_MORE = VIDEOS_PER_PAGE; 
const MAX_EMPTY_PAGE_AUTOFETCH_ATTEMPTS = 5; 
const MAX_INITIAL_LOAD_PAGES_ATTEMPTS = 20;

interface CreateReelPageProps {
  editMode?: boolean;
  allShowreels: Showreel[];
  setAllShowreels: React.Dispatch<React.SetStateAction<Showreel[]>>;
}

const CreateReelPage: React.FC<CreateReelPageProps> = ({ editMode = false, allShowreels, setAllShowreels }) => {
  const [formErrors, setFormErrors] = useState<{ directorName?: string; brandName?: string; videos?: string }>({});

  const [directorName, setDirectorName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [designStyle, setDesignStyle] = useState<ShowreelDesignStyle>(DEFAULT_DESIGN_STYLE_ID);

  const [aboutDirectorTitle, setAboutDirectorTitle] = useState('');
  const [aboutDirectorDescription, setAboutDirectorDescription] = useState('');
  const [aboutDirectorGifUrl, setAboutDirectorGifUrl] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const navigate = useNavigate();
  const { reelId } = useParams<{ reelId?: string }>();
  const { currentUser } = useAuth();
  const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);

  const [userLibraryCache, setUserLibraryCache] = useState<VimeoVideo[]>([]);
  const [nextPageToFetchUrl, setNextPageToFetchUrl] = useState<string | null>(null);
  const [totalVimeoVideos, setTotalVimeoVideos] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false); 
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing...');
  const [vimeoError, setVimeoError] = useState<string | null>(null);
  const [vimeoTokenExists, setVimeoTokenExists] = useState<boolean>(false);
  const [parsedVimeoToken, setParsedVimeoToken] = useState<string | null>(null);

  const [ephemeralCustomGifs, setEphemeralCustomGifs] = useState<Record<string, string>>({});
  const [sessionCustomGifData, setSessionCustomGifData] = useState<Map<string, string>>(new Map());
  const [editingCustomGifForVideoId, setEditingCustomGifForVideoId] = useState<string | null>(null);

  const [resolvedSelectedVideoObjects, setResolvedSelectedVideoObjects] = useState<Map<string, VimeoVideo>>(new Map());

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [videoToPreview, setVideoToPreview] = useState<VimeoVideo | null>(null);
  const [playingVideoIdInModal, setPlayingVideoIdInModal] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const draggedVideoIdRef = useRef<string | null>(null);


  const allAvailableVideosSource = useMemo(() => {
    return vimeoTokenExists && currentUser ? userLibraryCache : MOCK_VIDEOS;
  }, [userLibraryCache, vimeoTokenExists, currentUser]);


  useEffect(() => {
    const rawStoredToken = localStorage.getItem(VIMEO_TOKEN_KEY);
    let token: string | null = null;
    if (rawStoredToken) {
      try {
        const tempParsed = JSON.parse(rawStoredToken);
        if (typeof tempParsed === 'string' && tempParsed.trim()) {
          token = tempParsed.trim();
        }
      } catch (e) { console.warn(`Error parsing Vimeo token:`, e); }
    }
    setVimeoTokenExists(!!token);
    setParsedVimeoToken(token);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      setNextPageToFetchUrl(null);
      setTotalVimeoVideos(MOCK_VIDEOS.length);
      setUserLibraryCache([]);
      return;
    }
    
    if (!parsedVimeoToken) {
      setVimeoError("Vimeo API token not configured or is invalid. Displaying mock videos. Admins can configure the token on the 'Admin Dashboard' page.");
      setNextPageToFetchUrl(null);
      setTotalVimeoVideos(MOCK_VIDEOS.length);
      setUserLibraryCache([]);
      setIsLoading(false);
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const currentSignal = abortControllerRef.current.signal;

    setIsLoading(true);
    setVimeoError(null);
    setUserLibraryCache([]); 
    setNextPageToFetchUrl(null); 
    setTotalVimeoVideos(null);
    setLoadingMessage(debouncedSearchTerm.trim() ? `Searching for "${debouncedSearchTerm}"...` : "Loading your video library...");
    (abortControllerRef.current as any).lastSearchTerm = debouncedSearchTerm;

    const fetchAggressively = async () => {
      let accumulatedViewableVideos: VimeoVideo[] = [];
      let currentApiPageUrl: string | null = null; 
      let pagesFetched = 0;
      let apiTotalVideosReported: number | null = null;

      try {
        while (
          accumulatedViewableVideos.length < INITIAL_LOAD_COUNT &&
          pagesFetched < MAX_INITIAL_LOAD_PAGES_ATTEMPTS &&
          (pagesFetched === 0 || currentApiPageUrl) 
        ) {
          if (currentSignal.aborted) throw new Error('AbortError');

          const fetchOptions: FetchUserVideosOptions = {
            query: debouncedSearchTerm.trim() || undefined,
            perPage: VIDEOS_PER_PAGE, 
            signal: currentSignal,
          };
          if (currentApiPageUrl) {
            fetchOptions.pageUrl = currentApiPageUrl;
          }

          const response = await fetchUserVimeoVideos(parsedVimeoToken, fetchOptions);
          pagesFetched++;

          if (currentSignal.aborted) throw new Error('AbortError');

          if (response.videos.length > 0) {
            accumulatedViewableVideos = [...accumulatedViewableVideos, ...response.videos];
          }
          
          currentApiPageUrl = response.nextPageUrl;
          
          if (response.totalVideos !== null && apiTotalVideosReported === null) {
            apiTotalVideosReported = response.totalVideos;
            setTotalVimeoVideos(response.totalVideos);
          }
        }
        setUserLibraryCache(accumulatedViewableVideos);
        setNextPageToFetchUrl(currentApiPageUrl);

        if (accumulatedViewableVideos.length === 0 && pagesFetched > 0) {
          if (apiTotalVideosReported === 0 && !currentApiPageUrl) {
             if (debouncedSearchTerm.trim()) {
              setVimeoError(`No videos found matching "${debouncedSearchTerm.trim()}".`);
            } else {
              setVimeoError("No videos found in your Vimeo library.");
            }
          } else if (!currentApiPageUrl) {
            if (debouncedSearchTerm.trim()) {
              setVimeoError(`No videos found matching "${debouncedSearchTerm.trim()}" after checking all available results. Note: Private videos are grayed out and cannot be added.`);
            } else {
              setVimeoError("No videos found in your Vimeo library after checking all available results. Note: Private videos are grayed out and cannot be added.");
            }
          } else if (pagesFetched >= MAX_INITIAL_LOAD_PAGES_ATTEMPTS) {
             if (debouncedSearchTerm.trim()) {
                setVimeoError(`Searched ${pagesFetched} pages for "${debouncedSearchTerm.trim()}" but found fewer than ${INITIAL_LOAD_COUNT} videos. Try 'Load More'. Note: Private videos are grayed out and cannot be added.`);
            } else {
                setVimeoError(`Searched ${pagesFetched} pages of your library but found fewer than ${INITIAL_LOAD_COUNT} videos. Try 'Load More'. Note: Private videos are grayed out and cannot be added.`);
            }
          }
        }

      } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'AbortError') {
          console.log('Aggressive initial video fetch aborted');
          return; 
        }
        console.error("Failed during aggressive initial video fetch:", error);
        const err = error as Error & { isAuthError?: boolean; vimeoErrorData?: any };
        setVimeoError(err.message || "An unexpected error occurred while fetching videos.");
        setNextPageToFetchUrl(null);
      } finally {
        if (!currentSignal.aborted) {
          setIsLoading(false);
        }
      }
    };

    if (parsedVimeoToken) {
        fetchAggressively();
    } else {
        setIsLoading(false); 
    }

    return () => {
        abortControllerRef.current?.abort();
    };
  }, [currentUser, debouncedSearchTerm, vimeoTokenExists, parsedVimeoToken]);


  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    setDirectorName('');
    setBrandName('');
    setDescription('');
    setSelectedVideoIds([]);
    setDesignStyle(DEFAULT_DESIGN_STYLE_ID);
    setSessionCustomGifData(new Map());
    setEphemeralCustomGifs({}); 
    setEditingCustomGifForVideoId(null);
    setAboutDirectorTitle('');
    setAboutDirectorDescription('');
    setAboutDirectorGifUrl('');
    setFormErrors({});

    if (editMode && reelId) {
      const reelToEdit = allShowreels.find(r => r.id === reelId && r.userId === currentUser.id) as any;
      if (reelToEdit) {
        if (reelToEdit.directorName !== undefined && reelToEdit.brandName !== undefined) {
          setDirectorName(reelToEdit.directorName);
          setBrandName(reelToEdit.brandName);
        } else if (reelToEdit.title) {
          const parts = reelToEdit.title.split(' X ');
          if (parts.length === 2) {
            setDirectorName(parts[0].trim());
            setBrandName(parts[1].trim());
          } else {
            setDirectorName(reelToEdit.title.trim());
            setBrandName('');
          }
        }
        setDescription(reelToEdit.description || '');
        setDesignStyle(reelToEdit.designStyle || DEFAULT_DESIGN_STYLE_ID);

        const orderedVideoIds = [reelToEdit.featuredVideo.id, ...reelToEdit.otherVideos.map((v: VimeoVideo) => v.id)];
        setSelectedVideoIds(orderedVideoIds);

        setAboutDirectorTitle(reelToEdit.aboutDirectorTitle || '');
        setAboutDirectorDescription(reelToEdit.aboutDirectorDescription || '');
        setAboutDirectorGifUrl(reelToEdit.aboutDirectorGifUrl || '');

        const loadedSessionGifs = new Map<string, string>();
        const initialResolved = new Map<string, VimeoVideo>();
        const loadedEphemeralGifs: Record<string, string> = {};

        initialResolved.set(reelToEdit.featuredVideo.id, reelToEdit.featuredVideo);
        if (reelToEdit.featuredVideo.customThumbnailGifUrl) {
          loadedSessionGifs.set(reelToEdit.featuredVideo.id, reelToEdit.featuredVideo.customThumbnailGifUrl);
          loadedEphemeralGifs[reelToEdit.featuredVideo.id] = reelToEdit.featuredVideo.customThumbnailGifUrl;
        }
        reelToEdit.otherVideos.forEach((video: VimeoVideo) => {
          initialResolved.set(video.id, video);
          if (video.customThumbnailGifUrl) {
            loadedSessionGifs.set(video.id, video.customThumbnailGifUrl);
            loadedEphemeralGifs[video.id] = video.customThumbnailGifUrl;
          }
        });
        setResolvedSelectedVideoObjects(initialResolved);
        setSessionCustomGifData(loadedSessionGifs);
        setEphemeralCustomGifs(loadedEphemeralGifs);
      } else {
        alert("Showreel not found or you don't have permission to edit it.");
        navigate('/');
      }
    } else if (!editMode) {
        setResolvedSelectedVideoObjects(new Map());
    }
  }, [editMode, reelId, currentUser, navigate, allShowreels]);

  useEffect(() => {
    const newResolved = new Map<string, VimeoVideo>();
    selectedVideoIds.forEach(id => {
      let videoFound: VimeoVideo | undefined = resolvedSelectedVideoObjects.get(id);
      if (!videoFound) {
        videoFound = allAvailableVideosSource.find(v => v.id === id);
      }
      if (videoFound) {
        newResolved.set(id, videoFound);
      }
    });
    if (newResolved.size !== resolvedSelectedVideoObjects.size ||
        Array.from(newResolved.keys()).some(key => !resolvedSelectedVideoObjects.has(key))) {
      setResolvedSelectedVideoObjects(newResolved);
    }
  }, [selectedVideoIds, allAvailableVideosSource, resolvedSelectedVideoObjects]);


  const loadMoreVideosRecursiveHelper = useCallback(async (
    pageUrlToFetch: string,
    currentSignal: AbortSignal
  ): Promise<{ success: boolean, newNextPageUrl: string | null, newVideosAdded: boolean, errorOccurred?: boolean }> => {
    if (!vimeoTokenExists || !currentUser || !parsedVimeoToken) {
      return { success: false, newNextPageUrl: pageUrlToFetch, newVideosAdded: false, errorOccurred: true };
    }

    try {
      const response = await fetchUserVimeoVideos(parsedVimeoToken, {
        pageUrl: pageUrlToFetch,
        perPage: VIDEOS_PER_PAGE, 
        signal: currentSignal,
      });

      if (response.videos.length > 0) {
        setUserLibraryCache(prev => [...prev, ...response.videos]);
      }
      if (response.totalVideos !== null) {
        setTotalVimeoVideos(response.totalVideos);
      }
      
      return { 
        success: true, 
        newNextPageUrl: response.nextPageUrl, 
        newVideosAdded: response.videos.length > 0 
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw error; 
      }
      const err = error as Error & { isAuthError?: boolean; vimeoErrorData?: any };
      setVimeoError(err.message || "An unexpected error occurred while fetching more videos.");
      return { success: false, newNextPageUrl: null, newVideosAdded: false, errorOccurred: true };
    }
  }, [vimeoTokenExists, currentUser, setUserLibraryCache, setTotalVimeoVideos, setVimeoError, parsedVimeoToken]);


  const handleLoadMore = useCallback(async () => {
    if (!nextPageToFetchUrl || isLoadingMore || isLoading) return;

    setIsLoadingMore(true);
    setVimeoError(null); 

    abortControllerRef.current?.abort(); 
    const currentAbortController = new AbortController();
    abortControllerRef.current = currentAbortController;

    let currentUrlToFetch = nextPageToFetchUrl;
    let attempts = 0;
    
    while (currentUrlToFetch && attempts < MAX_EMPTY_PAGE_AUTOFETCH_ATTEMPTS) {
      if (currentAbortController.signal.aborted) {
        break;
      }
      attempts++;
      try {
        const result = await loadMoreVideosRecursiveHelper(currentUrlToFetch, currentAbortController.signal);
        setNextPageToFetchUrl(result.newNextPageUrl); 

        if (result.errorOccurred) { 
            break; 
        }
        currentUrlToFetch = result.newNextPageUrl ?? ""; 

        if (result.newVideosAdded) {
          break; 
        }
        if (!currentUrlToFetch) { 
          break;
        }
      } catch (error: any) { 
        if (error.name !== 'AbortError') {
          setVimeoError("An unexpected error occurred during the load more process.");
          setNextPageToFetchUrl(null); 
        }
        break; 
      }
    }
    
    if (!currentAbortController.signal.aborted) {
        setIsLoadingMore(false);
    } else {
        setIsLoadingMore(false); 
    }
  }, [nextPageToFetchUrl, isLoadingMore, isLoading, loadMoreVideosRecursiveHelper, setVimeoError, setNextPageToFetchUrl]);


  const handleVideoSelectToggle = useCallback((videoId: string) => {
    const video = allAvailableVideosSource.find(v => v.id === videoId);
    if (video && video.privacy !== 'anybody' && video.privacy !== 'unlisted') {
        return; 
    }

    setSelectedVideoIds(prevSelectedIdsArray => {
      const newSelectedIdsArray = [...prevSelectedIdsArray];
      const index = newSelectedIdsArray.indexOf(videoId);

      if (index > -1) {
        newSelectedIdsArray.splice(index, 1);
      } else {
        newSelectedIdsArray.push(videoId);
      }
      if (formErrors.videos) setFormErrors(prev => ({...prev, videos: undefined}));
      return newSelectedIdsArray;
    });
  }, [allAvailableVideosSource, formErrors.videos]);

  const handleSetCustomGifData = useCallback((videoId: string, gifUrl: string) => {
    const trimmedUrl = gifUrl.trim();
    setSessionCustomGifData(prevMap => {
      const newMap = new Map(prevMap);
      if (trimmedUrl) newMap.set(videoId, trimmedUrl);
      else newMap.delete(videoId);
      return newMap;
    });
    setEphemeralCustomGifs(prevGlobal => { 
      const newGlobalGifs = { ...prevGlobal };
      if (trimmedUrl) newGlobalGifs[videoId] = trimmedUrl;
      else delete newGlobalGifs[videoId];
      return newGlobalGifs;
    });
  }, [setEphemeralCustomGifs]);

  const handleToggleEditCustomGif = useCallback((videoId: string) => {
    setEditingCustomGifForVideoId(prev => (prev === videoId ? null : videoId));
  }, []);

  const handleOpenPreviewModal = useCallback((video: VimeoVideo) => {
    setVideoToPreview(video);
    setIsPreviewModalOpen(true);
    setPlayingVideoIdInModal(null);
    setEditingCustomGifForVideoId(null);
  }, []);

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setVideoToPreview(null);
    setPlayingVideoIdInModal(null);
    setEditingCustomGifForVideoId(null);
  };

  const handleModalVideoCardPlay = (videoId: string) => {
    setPlayingVideoIdInModal(currentId => currentId === videoId ? null : videoId);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, videoId: string) => {
    draggedVideoIdRef.current = videoId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCard = (e: React.DragEvent<HTMLDivElement>, targetVideoId: string) => {
    e.preventDefault();
    if (!draggedVideoIdRef.current || draggedVideoIdRef.current === targetVideoId) {
      draggedVideoIdRef.current = null;
      return;
    }
    const currentSelectedIds = [...selectedVideoIds];
    const draggedIndex = currentSelectedIds.indexOf(draggedVideoIdRef.current);
    const targetIndex = currentSelectedIds.indexOf(targetVideoId);
    if (draggedIndex === -1 || targetIndex === -1) {
      draggedVideoIdRef.current = null;
      return;
    }
    const [draggedItem] = currentSelectedIds.splice(draggedIndex, 1);
    currentSelectedIds.splice(targetIndex, 0, draggedItem);
    setSelectedVideoIds(currentSelectedIds);
    draggedVideoIdRef.current = null;
  };

  const handleDragEnd = () => {
    draggedVideoIdRef.current = null;
  };

  const handleMoveVideoUp = (videoId: string) => {
    setSelectedVideoIds(prev => {
      const index = prev.indexOf(videoId);
      if (index > 0) {
        const newArray = [...prev];
        [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
        return newArray;
      }
      return prev;
    });
  };

  const handleMoveVideoDown = (videoId: string) => {
    setSelectedVideoIds(prev => {
      const index = prev.indexOf(videoId);
      if (index < prev.length - 1 && index !== -1) {
        const newArray = [...prev];
        [newArray[index + 1], newArray[index]] = [newArray[index], newArray[index + 1]];
        return newArray;
      }
      return prev;
    });
  };


  const handleRemoveFromSelectedList = (videoIdToRemove: string) => {
    setSelectedVideoIds(prev => prev.filter(id => id !== videoIdToRemove));
    if (selectedVideoIds.length === 1 && formErrors.videos) {
        setFormErrors(prev => ({...prev, videos: undefined}));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { directorName?: string; brandName?: string; videos?: string } = {};
    if (!directorName.trim()) errors.directorName = 'Director Name is required.';
    if (!brandName.trim()) errors.brandName = 'Brand / Client Name is required.';
    if (selectedVideoIds.length === 0) errors.videos = 'Please select at least one video for the showreel.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.videos) alert(errors.videos);
      return;
    }
    setFormErrors({});

    if (!currentUser) {
      alert('You must be logged in to create or save a showreel.');
      navigate('/login');
      return;
    }

    const actualFeaturedVideoId = selectedVideoIds[0];
    if (!actualFeaturedVideoId) {
        alert('A featured video could not be determined. Please select at least one video.');
        return;
    }

    const getVideoWithAppliedCustomGif = (id: string): VimeoVideo | undefined => {
      const originalVideo = resolvedSelectedVideoObjects.get(id) ?? allAvailableVideosSource.find(v => v.id === id);
      if (!originalVideo) {
        console.error(`CRITICAL: Video ID ${id} completely missing during save.`);
        return undefined;
      }
      if (originalVideo.privacy !== 'anybody' && originalVideo.privacy !== 'unlisted') {
          console.warn(`Attempted to save a private video (ID: ${id}). This should be prevented. Skipping.`);
          return undefined;
      }
      const videoCopy: VimeoVideo = { ...originalVideo };
      const sessionGif = sessionCustomGifData.get(id);
      if (sessionGif !== undefined) {
        if (sessionGif.trim()) videoCopy.customThumbnailGifUrl = sessionGif.trim();
        else delete videoCopy.customThumbnailGifUrl;
      } else {
        const ephemeralGif = ephemeralCustomGifs[id]; 
        if (ephemeralGif) videoCopy.customThumbnailGifUrl = ephemeralGif;
        else delete videoCopy.customThumbnailGifUrl;
      }
      return videoCopy;
    };

    const finalFeaturedVideo = getVideoWithAppliedCustomGif(actualFeaturedVideoId);
    if (!finalFeaturedVideo) {
      alert('Featured video details could not be found or it is private. Please try again with a public/unlisted video.');
      return;
    }

    const finalOtherVideos: VimeoVideo[] = [];
    selectedVideoIds.forEach(id => {
      if (id !== actualFeaturedVideoId) {
        const videoDetail = getVideoWithAppliedCustomGif(id);
        if (videoDetail) finalOtherVideos.push(videoDetail);
      }
    });
    
    if (finalOtherVideos.some(v => v.privacy !== 'anybody' && v.privacy !== 'unlisted')) {
        alert('One or more selected videos are private and cannot be included. Please review your selections.');
        return;
    }

    const reelData: Omit<Showreel, 'id' | 'userId' | 'createdAt' | 'title'> = {
        directorName: directorName.trim(),
        brandName: brandName.trim(),
        description: description.trim() || undefined,
        featuredVideo: finalFeaturedVideo,
        otherVideos: finalOtherVideos,
        designStyle: designStyle,
        aboutDirectorTitle: aboutDirectorTitle.trim() || undefined,
        aboutDirectorDescription: aboutDirectorDescription.trim() || undefined,
        aboutDirectorGifUrl: aboutDirectorGifUrl.trim() || undefined,
    };

    let navigateToReelId: string;
    let updatedReelsForStorage: Showreel[];

    if (editMode && reelId) {
      updatedReelsForStorage = allShowreels.map(r =>
        (r.id === reelId && r.userId === currentUser.id)
        ? { ...r, ...reelData, createdAt: r.createdAt, id: r.id, userId: r.userId } as Showreel
        : r
      );
      navigateToReelId = reelId;
    } else {
      const newReelId = `reel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newReel: Showreel = {
        id: newReelId,
        userId: currentUser.id,
        ...reelData,
        createdAt: new Date().toISOString(),
      };
      updatedReelsForStorage = [...allShowreels, newReel];
      navigateToReelId = newReelId;
    }

    setAllShowreels(updatedReelsForStorage); 

    navigate(`/reel/${navigateToReelId}`);
  };

  const isCurrentlySearching = isLoading && !!debouncedSearchTerm.trim();

  const renderSearchResultCount = () => {
    if (vimeoTokenExists && currentUser) {
        if (isLoading && !debouncedSearchTerm.trim() && userLibraryCache.length === 0) return <>Loading your video library...</>;
        if (isCurrentlySearching && userLibraryCache.length === 0) return <>Searching for "<em>{debouncedSearchTerm}</em>"...</>;
        
        let messageElement: React.ReactNode = null;

        if (totalVimeoVideos !== null) {
            if (debouncedSearchTerm.trim()) {
                const baseSearchMessage = <>Found <strong>{totalVimeoVideos}</strong> total matches for "<em>{debouncedSearchTerm}</em>".</>;
                 if (userLibraryCache.length === 0 && totalVimeoVideos > 0 && !isLoading) {
                     messageElement = <>{baseSearchMessage} <span className="text-xs opacity-75">No videos found yet. Try 'Load More'.</span></>;
                 } else {
                    messageElement = baseSearchMessage;
                 }
            } else { 
                messageElement = <>Your Library: <strong>{totalVimeoVideos}</strong> total videos.</>;
            }
        } else if (isLoading) { 
            return <>Loading video count...</>;
        } else { 
            return <>Video count unavailable.</>;
        }
        
        const suffix = totalVimeoVideos !== null ? <span className="text-xs opacity-70"> (Private videos are grayed out and cannot be added to reels)</span> : null;

        return <>{messageElement}{suffix}</>;
    }
    return <>Displaying {MOCK_VIDEOS.length} mock videos for demonstration.</>;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-brand-blue/10">
          <Link
            to="/"
            className="group flex items-center bg-brand-blue text-white font-semibold px-3 py-2 rounded-md hover:bg-brand-lime hover:text-brand-blue transition-opacity"
            title="Go Back to Homepage"
            aria-label="Go Back to Homepage"
          >
              <ChevronLeftIcon className="w-6 h-6 mr-1 text-white group-hover:text-brand-lime" />
              <span className="text-white group-hover:text-brand-blue">Back</span>
          </Link>
          <h1 className="text-3xl font-bold text-brand-blue text-center flex-grow">
            {editMode ? 'Edit Showreel' : 'Create New Showreel'}
          </h1>
          <button
              type="submit"
              className="group flex items-center bg-brand-blue text-white font-bold px-4 py-2 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-all transform hover:scale-105"
              title={editMode ? 'Save Changes' : 'Create Showreel'}
              aria-label={editMode ? 'Save Changes' : 'Create Showreel'}
            >
              <SaveIcon className="w-5 h-5 mr-2 text-white group-hover:text-brand-lime" />
              <span className="text-white group-hover:text-brand-blue">{editMode ? 'Save' : 'Create'}</span>
          </button>
      </div>

      {/* Director Name and Brand Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="directorName" className="block text-lg font-semibold text-brand-blue mb-1.5">
            Director Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="directorName"
            value={directorName}
            onChange={(e) => {
              setDirectorName(e.target.value.toUpperCase());
              if (formErrors.directorName) setFormErrors(prev => ({...prev, directorName: undefined}));
            }}
            placeholder="e.g., MAGNUS RENFORS"
            className={`w-full p-3 border rounded-lg focus:ring-2 outline-none bg-transparent focus:bg-brand-pink/20 text-brand-blue placeholder-brand-blue/60 uppercase ${formErrors.directorName ? 'border-red-500 focus:ring-red-500' : 'border-brand-blue/50 focus:ring-brand-blue'}`}
            required
            aria-invalid={!!formErrors.directorName}
            aria-describedby={formErrors.directorName ? "directorName-error" : undefined}
          />
          {formErrors.directorName && <p id="directorName-error" className="text-sm text-red-600 mt-1">{formErrors.directorName}</p>}
        </div>
        <div>
          <label htmlFor="brandName" className="block text-lg font-semibold text-brand-blue mb-1.5">
            Brand / Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="brandName"
            value={brandName}
            onChange={(e) => {
              setBrandName(e.target.value.toUpperCase());
              if (formErrors.brandName) setFormErrors(prev => ({...prev, brandName: undefined}));
            }}
            placeholder="e.g., ALLIANZ DIRECT"
            className={`w-full p-3 border rounded-lg focus:ring-2 outline-none bg-transparent focus:bg-brand-pink/20 text-brand-blue placeholder-brand-blue/60 uppercase ${formErrors.brandName ? 'border-red-500 focus:ring-red-500' : 'border-brand-blue/50 focus:ring-brand-blue'}`}
            required
            aria-invalid={!!formErrors.brandName}
            aria-describedby={formErrors.brandName ? "brandName-error" : undefined}
          />
          {formErrors.brandName && <p id="brandName-error" className="text-sm text-red-600 mt-1">{formErrors.brandName}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-lg font-semibold text-brand-blue mb-1.5">
          Description / Intro Text (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short, impactful description for your showreel..."
          className="w-full p-3 border border-brand-blue/50 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none bg-transparent focus:bg-brand-pink/20 text-brand-blue placeholder-brand-blue/60 min-h-[100px]"
          rows={3}
        />
      </div>

      {/* Design Style Picker */}
      <div>
        <label id="designStyleLabel" className="block text-lg font-semibold text-brand-blue mb-3">
          Visual Design Style (Optional)
        </label>
        <div
          className="grid grid-cols-2 gap-3 sm:gap-4"
          role="radiogroup"
          aria-labelledby="designStyleLabel"
        >
          {designStyles.map(style => (
            <DesignStyleCard
              key={style.id}
              design={style}
              isSelected={designStyle === style.id}
              onSelect={() => setDesignStyle(style.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Video Selection Section */}
       <div className="space-y-6 border-t border-b border-brand-blue/10 py-8">
        <h2 className="text-2xl font-semibold text-brand-blue text-center">Select Your Videos <span className="text-red-500">*</span></h2>
         {formErrors.videos && <p className="text-sm text-red-600 text-center -mt-4">{formErrors.videos}</p>}
        
        <div className="border border-brand-blue/20 rounded-xl p-4 sm:p-6 bg-brand-pink/5 shadow-inner">
          <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8"> {/* Main container for video lists */}
              
              {/* Selected for Reel Section - order-1 on mobile */}
              <div className="order-1 md:order-2 md:col-span-1 space-y-3 md:sticky md:top-20 self-start">
                  <h3 className="text-xl font-semibold text-brand-blue">
                      Selected for Reel ({selectedVideoIds.length} video{selectedVideoIds.length === 1 ? '' : 's'})
                  </h3>
                  {selectedVideoIds.length === 0 ? (
                      <div className="text-brand-blue/70 text-sm p-6 border-2 border-dashed border-brand-blue/30 rounded-lg text-center bg-brand-pink/10">
                          <p className="md:hidden">Select videos from the list below to add them here.</p>
                          <p className="hidden md:block">Select videos from the list on the left to add them here.</p>
                          <p className="mt-1">The first video added will be the main/featured video.</p>
                          <p className="mt-1">
                            <span className="md:hidden">Use arrows to reorder.</span>
                            <span className="hidden md:inline">Drag to reorder selected videos.</span>
                          </p>
                      </div>
                  ) : (
                      <>
                      <div
                          className="space-y-0 max-h-[600px] overflow-y-auto custom-scrollbar border border-brand-blue/10 rounded-lg bg-brand-pink/5" 
                          onDragOver={handleDragOver} 
                      >
                          {selectedVideoIds.map((videoId, index) => {
                              const video = resolvedSelectedVideoObjects.get(videoId);
                              if (!video) return (
                                  <div key={videoId} className="p-3 border-b border-brand-blue/5 text-red-700 text-xs">
                                      Video ID: {videoId} - Details loading or unavailable...
                                  </div>
                              );
                              return (
                                  <SelectedVideoListItem
                                      key={video.id}
                                      video={video}
                                      isFeatured={index === 0} 
                                      onRemove={() => handleRemoveFromSelectedList(video.id)}
                                      onPreview={handleOpenPreviewModal}
                                      onDragStart={(e) => handleDragStart(e, video.id)}
                                      onDrop={(e) => handleDropOnCard(e, video.id)}
                                      onDragOver={handleDragOver}
                                      onDragEnd={handleDragEnd}
                                      onMoveUp={() => handleMoveVideoUp(video.id)}
                                      onMoveDown={() => handleMoveVideoDown(video.id)}
                                      isFirst={index === 0}
                                      isLast={index === selectedVideoIds.length - 1}
                                  />
                              );
                          })}
                      </div>
                      <p className="text-xs text-brand-blue/70 text-center">
                        <span className="md:hidden">Use arrows to reorder. </span>
                        <span className="hidden md:inline">Drag to reorder. </span>
                         The first video is featured.
                      </p>
                      </>
                  )}
              </div>

              {/* Available Videos Section - order-2 on mobile */}
              <div className="order-2 md:order-1 md:col-span-2 space-y-4">
                <h3 className="text-xl font-semibold text-brand-blue">
                    Available Videos
                </h3>
                <p className="text-brand-blue/80 text-sm -mt-2">
                    {renderSearchResultCount()}
                </p>

                {currentUser && vimeoTokenExists && (
                    <div className="relative mx-auto w-full" onClick={(e) => e.stopPropagation()}> 
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isCurrentlySearching ? (
                            <LoadingSpinnerIcon className="h-5 w-5 text-brand-blue/70" />
                        ) : (
                            <SearchIcon className="h-5 w-5 text-brand-blue/70" />
                        )}
                    </div>
                    <input
                        type="search"
                        placeholder="Search your Vimeo library..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full p-3.5 pl-10 text-base border border-brand-blue/30 rounded-lg focus:ring-2 focus:ring-brand-lime outline-none bg-white/10 focus:bg-white/20 text-brand-blue placeholder-brand-blue/60 shadow-none"
                    />
                    </div>
                )}

                {isLoading && !isLoadingMore && userLibraryCache.length === 0 && (
                    <div className="text-center py-6 text-brand-blue/80">
                        <p>{loadingMessage}</p>
                    </div>
                )}

                {vimeoError && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Vimeo Library Error</p>
                    <p className="text-sm">{vimeoError}</p>
                    {!vimeoTokenExists && isAdmin && (
                        <p className="text-sm mt-2">Admins: <Link to="/admin-dashboard" className="font-semibold underline hover:text-red-800">Configure Vimeo Token</Link>.</p>
                    )}
                    </div>
                )}

                {!isLoading && allAvailableVideosSource.length === 0 && !vimeoError && (
                    <p className="text-brand-blue/70 text-center py-8">
                    {currentUser && vimeoTokenExists ? 'No videos found in your Vimeo library or matching your search.' : 'No mock videos available. This is unexpected.'}
                    </p>
                )}

                <div className="border border-brand-blue/10 rounded-lg max-h-[600px] overflow-y-auto custom-scrollbar bg-brand-pink/5">
                    {(isLoading && userLibraryCache.length === 0 && !isLoadingMore) ? (
                        Array.from({ length: INITIAL_LOAD_COUNT }).map((_, index) => ( 
                            <VideoListItemSkeleton key={`skeleton-initial-${index}`} />
                        ))
                    ) : (
                        allAvailableVideosSource.map(video => (
                        <VideoListItem
                            key={video.id}
                            video={video}
                            isSelected={selectedVideoIds.includes(video.id)}
                            onSelect={handleVideoSelectToggle}
                            onPreview={handleOpenPreviewModal}
                            privacyStatus={video.privacy}
                        />
                        ))
                    )}
                    {isLoadingMore && Array.from({ length: SKELETONS_ON_LOAD_MORE }).map((_, index) => (
                        <VideoListItemSkeleton key={`skeleton-more-${index}`} />
                    ))}
                </div>

                {nextPageToFetchUrl && !isLoading && (
                    <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore || isLoading}
                    className="w-full bg-brand-blue text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-colors disabled:opacity-60 mt-3"
                    >
                    {isLoadingMore ? 'Loading More...' : 'Load More Videos'}
                    </button>
                )}
              </div>
          </div>
        </div>
      </div>
      
      {/* Optional Custom Information Section */}
      <div className="space-y-4">
          <h3 className="text-xl font-semibold text-brand-blue">Optional: Custom 'About' Section</h3>
          <p className="text-sm text-brand-blue/80">
          Add a title, description, and an optional GIF for a custom information section (e.g., about the director, artist, project, or any other relevant details).
          </p>
          <div>
          <label htmlFor="aboutDirectorTitle" className="block text-md font-semibold text-brand-blue mb-1">
              Section Title
          </label>
          <input
              type="text"
              id="aboutDirectorTitle"
              value={aboutDirectorTitle}
              onChange={(e) => setAboutDirectorTitle(e.target.value)}
              placeholder="e.g., About the Director, Project Overview, Artist Statement"
              className="w-full p-2.5 border border-brand-blue/40 rounded-md focus:ring-1 focus:ring-brand-blue outline-none bg-transparent focus:bg-brand-pink/10 text-brand-blue placeholder-brand-blue/50"
          />
          </div>
          <div>
          <label htmlFor="aboutDirectorDescription" className="block text-md font-semibold text-brand-blue mb-1">
              Section Content / Description
          </label>
          <textarea
              id="aboutDirectorDescription"
              value={aboutDirectorDescription}
              onChange={(e) => setAboutDirectorDescription(e.target.value)}
              placeholder="Enter the content for this section. This could be a biography, project details, an artist's statement, etc."
              className="w-full p-2.5 border border-brand-blue/40 rounded-md focus:ring-1 focus:ring-brand-blue outline-none bg-transparent focus:bg-brand-pink/10 text-brand-blue placeholder-brand-blue/50 min-h-[120px]"
              rows={4}
          />
          </div>
          {isAdmin && ( 
              <div>
              <label htmlFor="aboutDirectorGifUrl" className="block text-md font-semibold text-brand-blue mb-1">
                  Section Image/GIF URL (Optional)
              </label>
              <input
                  type="url"
                  id="aboutDirectorGifUrl"
                  value={aboutDirectorGifUrl}
                  onChange={(e) => setAboutDirectorGifUrl(e.target.value)}
                  placeholder="https://example.com/image.gif"
                  className="w-full p-2.5 border border-brand-blue/40 rounded-md focus:ring-1 focus:ring-brand-blue outline-none bg-transparent focus:bg-brand-pink/10 text-brand-blue placeholder-brand-blue/50"
              />
              {aboutDirectorGifUrl && (
                  <img src={aboutDirectorGifUrl} alt="Custom Section GIF Preview" className="mt-2 max-w-xs max-h-32 object-contain border border-brand-blue/20 rounded" />
              )}
              </div>
          )}
      </div>

      {isPreviewModalOpen && videoToPreview && (
        <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={(e) => { if (e.target === e.currentTarget) handleClosePreviewModal();}}
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-modal-title"
        >
          <div className="bg-brand-pink p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl relative border border-brand-blue/30">
            <div className="flex justify-between items-center mb-3">
                <h3 id="preview-modal-title" className="text-xl font-semibold text-brand-blue truncate pr-8" title={videoToPreview.title}>
                    Preview: {videoToPreview.title}
                </h3>
                <button
                    onClick={handleClosePreviewModal}
                    className="text-brand-blue hover:text-brand-lime p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-lime"
                    aria-label="Close preview"
                    title="Close Preview"
                >
                    <CloseIcon className="w-7 h-7" />
                </button>
            </div>
            <VideoCard
                video={videoToPreview}
                isSelected={false}
                onSelect={() => {}}
                showActions={true}
                onClick={() => handleModalVideoCardPlay(videoToPreview.id)}
                hideDetails={false}
                sharpCorners={false}
                isAdmin={isAdmin}
                customGifUrlValue={sessionCustomGifData.get(videoToPreview.id) ?? ephemeralCustomGifs[videoToPreview.id] ?? ''}
                onSetCustomGif={handleSetCustomGifData}
                isEditingCustomGif={editingCustomGifForVideoId === videoToPreview.id}
                onToggleEditCustomGif={() => handleToggleEditCustomGif(videoToPreview.id)}
                cardVariant="default"
                isPlaying={playingVideoIdInModal === videoToPreview.id}
            />
          </div>
        </div>
      )}

      <div className="pt-8 mt-8 border-t border-brand-blue/10 flex flex-col items-center space-y-4">
        <button
            type="submit"
            className="group flex items-center bg-brand-blue text-white font-bold px-8 py-3 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-all transform hover:scale-105 text-lg"
            title={editMode ? 'Save Changes' : 'Create Showreel'}
            aria-label={editMode ? 'Save Changes' : 'Create Showreel'}
          >
            <SaveIcon className="w-6 h-6 mr-2.5 text-white group-hover:text-brand-lime" />
            <span className="text-white group-hover:text-brand-blue">{editMode ? 'Save Showreel' : 'Create Showreel'}</span>
        </button>
        <div className="text-sm text-brand-blue/80 text-center">
            <p><span className="font-semibold">Director:</span> {directorName || "N/A"}</p>
            <p><span className="font-semibold">Brand/Client:</span> {brandName || "N/A"}</p>
            <p><span className="font-semibold">Videos Selected:</span> {selectedVideoIds.length}</p>
            <p><span className="font-semibold">Design:</span> {designStyles.find(d => d.id === designStyle)?.name || 'Default'}</p>
            { (aboutDirectorTitle || aboutDirectorDescription || (isAdmin && aboutDirectorGifUrl)) &&
                <p><span className="font-semibold">Custom Info:</span> Content added</p>
            }
        </div>
      </div>
    </form>
  );
};

export default CreateReelPage;