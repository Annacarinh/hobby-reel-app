
import { VimeoVideo } from '../types';

// Helper to format duration from seconds (e.g., 305 seconds) to "M:SS" or "H:MM:SS"
const formatVimeoDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const paddedMinutes = minutes < 10 && hours > 0 ? `0${minutes}` : minutes;

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
};

// Helper to format upload date from ISO string to "MMM DD, YYYY"
const formatUploadDate = (isoDateString: string): string => {
  if (!isoDateString) return 'N/A';
  try {
    const date = new Date(isoDateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    console.warn("Could not parse upload date:", isoDateString, e);
    return 'N/A';
  }
};


export interface FetchUserVideosOptions {
  query?: string;
  pageUrl?: string; 
  perPage?: number;
  signal?: AbortSignal; 
}

export interface FetchUserVideosResponse {
  videos: VimeoVideo[];
  nextPageUrl: string | null;
  totalVideos: number | null;
}

const DEFAULT_PER_PAGE = 10; 

export const fetchUserVimeoVideos = async (
  token: string,
  options?: FetchUserVideosOptions
): Promise<FetchUserVideosResponse> => {
  if (!token) {
    const authError: Error & { isAuthError?: boolean } = new Error(
      "Vimeo API Authentication Error: Token is missing. Please configure it on the Admin Dashboard page."
    );
    authError.isAuthError = true;
    throw authError;
  }

  let apiUrlString: string;
  const perPageToUse = options?.perPage || DEFAULT_PER_PAGE;
  const essentialFields = 'uri,name,duration,pictures.sizes,pictures.animated,link,player_embed_url,privacy,paging,total,upload_date,created_time';


  if (options?.pageUrl) {
    try {
      const url = new URL(options.pageUrl, 'https://api.vimeo.com'); 
      // Ensure per_page and fields are correctly set/overridden for paged requests
      url.searchParams.set('per_page', perPageToUse.toString());
      url.searchParams.set('fields', essentialFields); // Explicitly set fields for consistency
      apiUrlString = url.toString();
    } catch (e) {
      console.error("Error constructing URL from options.pageUrl, falling back. This may cause issues:", e);
      apiUrlString = options.pageUrl; 
    }
  } else {
    const params = new URLSearchParams();
    params.append('fields', essentialFields);
    params.append('per_page', perPageToUse.toString());
    params.append('sort', 'date'); 
    params.append('direction', 'desc');

    if (options?.query && options.query.trim()) {
      params.append('query', options.query.trim());
    }
    apiUrlString = `https://api.vimeo.com/me/videos?${params.toString()}`;
  }

  console.log(`[VimeoService] Fetching URL: ${apiUrlString}`);

  try {
    const response = await fetch(apiUrlString, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4',
      },
      signal: options?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse Vimeo error response as JSON" }));
      console.error(`Error fetching user videos from Vimeo. Status:`, response.status, 'URL:', apiUrlString, 'Response Body:', errorData);

      let errorMessage = `Vimeo API error (${response.status}) during user videos fetch: ${errorData.developer_message || errorData.error || response.statusText}`;
      const customError: Error & { isAuthError?: boolean; vimeoErrorData?: any; name?: string } = new Error(errorMessage);
      customError.vimeoErrorData = errorData;

      if (response.status === 401) {
        customError.isAuthError = true;
        customError.message = `Vimeo API Authentication Error (401): ${errorData.developer_message || errorData.error || 'The app didn\'t receive valid user credentials.'} Please ensure your Vimeo Personal Access Token is correct, not expired, and has ALL of the following scopes enabled: 'public', 'private', and 'video_files'. You can regenerate your token on the Vimeo Developer site and save it on the Admin Dashboard.`;
      }
      throw customError;
    }

    const data = await response.json();

    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error('Vimeo API response for user videos did not contain an array in data.data:', data);
      return { videos: [], nextPageUrl: null, totalVideos: data.total ?? null };
    }
    
    const rawApiVideos = data.data;
    console.log(`[VimeoService] API returned ${rawApiVideos.length} videos. Query: "${options?.query || 'N/A'}", PageURL used: ${options?.pageUrl ? 'Yes' : 'No'}`);

    // Removed client-side filtering:
    // const visiblePrivacySettings = ['anybody', 'unlisted'];
    // const filteredApiVideos = rawApiVideos.filter((item: any) => 
    // item.privacy && visiblePrivacySettings.includes(item.privacy.view)
    // );
    // console.log(`[VimeoService] Filtered to ${filteredApiVideos.length} videos after client-side privacy check (anybody, unlisted).`);


    const mappedVideos = rawApiVideos.map((item: any): VimeoVideo => { // Use rawApiVideos directly
      const videoId = item.uri?.split('/').pop() || `unknown-${Date.now()}-${Math.random()}`;
      
      const staticPictureCandidates = item.pictures?.sizes || [];
      let bestStaticThumbnailUrl: string = 
          staticPictureCandidates.find((s: any) => s.width >= 1280 && s.link_with_play_button)?.link ||
          staticPictureCandidates.find((s: any) => s.width >= 1280 && s.link)?.link ||
          staticPictureCandidates.find((s: any) => s.width >= 640 && s.link_with_play_button)?.link || 
          staticPictureCandidates.find((s: any) => s.width >= 640 && s.link)?.link ||
          (staticPictureCandidates.length > 0 ? staticPictureCandidates[staticPictureCandidates.length - 1]?.link : null) ||
          `https://placehold.co/640x360/eec0dd/162bf4/png?text=No+Thumb&font=sans-serif`; 

      let finalVideoLoopUrl: string | undefined = undefined;
      let finalThumbnailUrl: string = bestStaticThumbnailUrl; 

      if (item.pictures?.animated && Array.isArray(item.pictures.animated) && item.pictures.animated.length > 0) {
        const mp4Loop = item.pictures.animated.find((anim: any) => anim.link && typeof anim.link === 'string' && anim.link.toLowerCase().endsWith('.mp4'));
        if (mp4Loop) {
          finalVideoLoopUrl = mp4Loop.link;
          // If MP4 loop exists, poster (thumbnailUrl) should ideally be a static image.
          // The bestStaticThumbnailUrl already serves this purpose.
        } else {
          // No MP4 loop, check for GIF to use as the primary thumbnail
          const gifThumbnail = item.pictures.animated.find((anim: any) => anim.link && typeof anim.link === 'string' && anim.link.toLowerCase().endsWith('.gif'));
          if (gifThumbnail) {
            finalThumbnailUrl = gifThumbnail.link; 
          }
        }
      }

      let videoUrl = item.player_embed_url || `https://player.vimeo.com/video/${videoId}`;
      // Validate and ensure player_embed_url format if necessary
      if (typeof videoUrl === 'string' && !videoUrl.startsWith('https://player.vimeo.com/video/')) {
        console.warn(`[VimeoService] Received non-standard player_embed_url "${videoUrl}", standardizing for videoId ${videoId}.`);
        videoUrl = `https://player.vimeo.com/video/${videoId}`;
      } else if (typeof videoUrl !== 'string') {
        console.warn(`[VimeoService] Received invalid player_embed_url type for videoId ${videoId}, falling back to standard format.`);
        videoUrl = `https://player.vimeo.com/video/${videoId}`;
      }
      
      const uploadDateSource = item.upload_date || item.created_time; // Prefer upload_date if available

      return {
        id: videoId,
        title: item.name || 'Untitled Video',
        thumbnailUrl: finalThumbnailUrl, 
        videoLoopUrl: finalVideoLoopUrl,
        videoUrl: videoUrl,
        duration: item.duration ? formatVimeoDuration(item.duration) : 'N/A',
        uploadDate: uploadDateSource ? formatUploadDate(uploadDateSource) : 'N/A',
        privacy: item.privacy?.view || 'unknown', // Store privacy status
      };
    });
    
    return {
      videos: mappedVideos,
      nextPageUrl: data.paging?.next || null,
      totalVideos: data.total ?? null, 
    };

  } catch (error: any) { 
    if (error.name === 'AbortError') {
      console.log('[VimeoService] Fetch aborted by user signal.');
      // Let the calling code handle the AbortError specifically
    } else {
      console.error(`[VimeoService] General failure in fetchUserVimeoVideos:`, error);
    }
    // Re-throw the error so the caller can handle its type (e.g. AbortError vs other errors)
    throw error;
  }
};