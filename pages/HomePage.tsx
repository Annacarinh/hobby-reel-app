import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// import useLocalStorage from '../hooks/useLocalStorage'; // No longer using localStorage for showreels
import { Showreel } from '../types';
import ReelCard from '../components/ReelCard';
import { PlusIcon } from '../components/icons/PlusIcon';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { getDesignStyleById, DesignStyle, DEFAULT_DESIGN_STYLE_ID } from '../designStyles';

interface HomePageProps {
  allShowreels: Showreel[];
  setAllShowreels: React.Dispatch<React.SetStateAction<Showreel[]>>;
}

const HomePage: React.FC<HomePageProps> = ({ allShowreels, setAllShowreels }) => {
  const { currentUser } = useAuth();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [currentReelToShare, setCurrentReelToShare] = useState<Showreel | null>(null);
  const [currentReelDesign, setCurrentReelDesign] = useState<DesignStyle>(getDesignStyleById(DEFAULT_DESIGN_STYLE_ID));


  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reelToDeleteId, setReelToDeleteId] = useState<string | null>(null);

  const getDisplayTitle = (reel: Showreel | undefined | null): string => {
    if (!reel) return "Untitled Showreel";
    return (reel as any).directorName !== undefined && (reel as any).brandName !== undefined
      ? `${(reel as any).directorName} X ${(reel as any).brandName}`
      : (reel as any).title || "Untitled Showreel";
  };

  const handleDeleteReel = (id: string) => {
    setReelToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = () => {
    if (reelToDeleteId) {
      setAllShowreels(prevReels => prevReels.filter(reel => reel.id !== reelToDeleteId));
    }
    setIsDeleteModalOpen(false);
    setReelToDeleteId(null);
  };

  const handleOpenShareModal = (reel: Showreel) => {
    setCurrentReelToShare(reel);
    setCurrentReelDesign(getDesignStyleById(reel.designStyle));
    setIsShareModalOpen(true);
  };

  const userShowreels = currentUser
    ? allShowreels.filter(reel => reel.userId === currentUser.id)
    : [];

  const sortedShowreels = [...userShowreels].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getReelUrl = (reelId: string) => {
    try {
      // Use window.location.origin + window.location.pathname to build the base URL up to the hash
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      return new URL(`#/reel/${reelId}`, baseUrl).href;
    } catch (e) {
      console.error("Error creating URL for sharing:", e);
      // Fallback for environments where new URL() might fail with relative paths if base is complex
      const base = window.location.href.split('#')[0];
      return `${base}#/reel/${reelId}`;
    }
  };

  const getFeaturedImageUrl = (reel: Showreel): string => {
    if (reel.featuredVideo.customThumbnailGifUrl) return reel.featuredVideo.customThumbnailGifUrl;
    if (reel.featuredVideo.videoLoopUrl && reel.featuredVideo.videoLoopUrl.toLowerCase().endsWith('.gif')) return reel.featuredVideo.videoLoopUrl;
    return reel.featuredVideo.thumbnailUrl;
  };


  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-brand-blue mb-4">
          {currentUser ? `${currentUser.name}'s Showreels` : 'Your Showreels'}
        </h2>
        <p className="text-lg text-brand-blue/90 max-w-2xl mx-auto">
          {currentUser ? 'Manage your existing showreels or create stunning new ones.' : 'Log in or sign up to view and manage your showreels.'}
        </p>
      </div>

      {!currentUser ? (
        <div className="text-center py-12 border border-brand-blue/20 rounded-xl">
          <PlusIcon className="w-16 h-16 text-brand-blue/60 mx-auto mb-4" />
          <p className="text-xl text-brand-blue/80 mb-6">Please log in or sign up to see your showreels.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/login"
              className="bg-brand-blue text-white font-bold px-8 py-3 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-all text-lg transform hover:scale-105 inline-block"
              title="Go to Login Page"
            >
              Go to Login
            </Link>
            <Link
              to="/signup"
              className="bg-transparent border-2 border-brand-blue text-brand-blue font-bold px-8 py-3 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-all text-lg transform hover:scale-105 inline-block"
              title="Go to Sign Up Page"
            >
              Sign Up
            </Link>
          </div>
        </div>
      ) : sortedShowreels.length === 0 ? (
        <div className="text-center py-16 border border-brand-blue/20 rounded-xl">
          <p className="text-xl text-brand-blue/80 mb-8">You haven't created any showreels yet.</p>
          <Link
            to="/create"
            className="bg-brand-blue text-white font-bold px-8 py-3 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-all text-lg transform hover:scale-105 inline-block"
            title="Create Your First Showreel"
          >
            Create Your First Showreel
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {sortedShowreels.map(reel => (
            <ReelCard
              key={reel.id}
              reel={reel}
              onDelete={handleDeleteReel}
              onShare={handleOpenShareModal}
            />
          ))}
        </div>
      )}

      {isShareModalOpen && currentReelToShare && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          reelTitle={getDisplayTitle(currentReelToShare)}
          reelDescription={currentReelToShare.description}
          reelUrl={getReelUrl(currentReelToShare.id)}
          featuredVideoImageUrl={getFeaturedImageUrl(currentReelToShare)}
          designStyle={currentReelDesign}
          reelData={currentReelToShare} 
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the showreel "${getDisplayTitle(allShowreels.find(r => r.id === reelToDeleteId))}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default HomePage;