import React, { useState, useEffect } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { MailIcon } from './icons/MailIcon';
import { CloseIcon } from './icons/CloseIcon';
import { DesignStyle } from '../designStyles';
import { Showreel } from '../types';
import { GlobeIcon } from './icons/GlobeIcon';
import { LoadingSpinnerIcon } from './icons/LoadingSpinnerIcon';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reelTitle: string;
  reelDescription?: string;
  reelUrl: string; // Base URL (local session or Gist if viewing Gist)
  featuredVideoImageUrl: string;
  designStyle: DesignStyle;
  reelData: Showreel | null;
  isGistView?: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  reelTitle,
  reelDescription,
  reelUrl,
  featuredVideoImageUrl,
  designStyle,
  reelData,
  isGistView = false,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  const [isCreatingGist, setIsCreatingGist] = useState(false);
  const [generatedGistUrl, setGeneratedGistUrl] = useState<string | null>(null);
  const [gistError, setGistError] = useState<string | null>(null);

  // Determine the primary URL to display/use
  const universalLinkToShow = isGistView ? reelUrl : generatedGistUrl;
  const showLocalLinkFallback = !universalLinkToShow && !isGistView && gistError;

  useEffect(() => {
    if (!isOpen) {
      setRecipientEmail('');
      setCopyFeedback(null);
      setEmailFeedback(null);
      setGeneratedGistUrl(null);
      setGistError(null);
      setIsCreatingGist(false);
    } else if (isGistView) {
      setGeneratedGistUrl(reelUrl); // Pre-fill if already viewing a Gist
    }
  }, [isOpen, isGistView, reelUrl]);

  const setupFeedbackTimer = (setter: React.Dispatch<React.SetStateAction<string | null>>, duration = 3000) => {
    const timer = setTimeout(() => setter(null), duration);
    return () => clearTimeout(timer);
  };

  useEffect(() => { if (copyFeedback) return setupFeedbackTimer(setCopyFeedback); }, [copyFeedback]);
  useEffect(() => { if (emailFeedback) return setupFeedbackTimer(setEmailFeedback, 4000); }, [emailFeedback]);

  const handleCopyToClipboard = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy)
      .then(() => setCopyFeedback('Link copied to clipboard!'))
      .catch(err => {
        console.error('Failed to copy link: ', err);
        setCopyFeedback('Failed to copy. Please copy manually.');
      });
  };

  const handleShareViaEmail = () => {
    if (!recipientEmail.trim() || !recipientEmail.includes('@') || !recipientEmail.includes('.')) {
      setEmailFeedback('Please enter a valid recipient email address.');
      return;
    }

    const urlForEmail = universalLinkToShow || (showLocalLinkFallback ? reelUrl : reelUrl); // Prefer universal, then fallback
    const subject = encodeURIComponent(`Check out this Hobby Reel: ${reelTitle}`);
    const emailBodyHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #333333; line-height: 1.6; padding: 15px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <p style="margin-bottom: 15px; font-size: 16px;">Hi there,</p>
          ${reelDescription ? `<p style="margin-bottom: 15px; font-size: 15px; font-style: italic; color: #555555; border-left: 3px solid #162bf4; padding-left: 10px;">${reelDescription.replace(/\n/g, '<br />')}</p>` : ''}
          <p style="margin-bottom: 20px; font-size: 16px;">Here is "<strong>${reelTitle}</strong>" for you! Enjoy</p>
          ${featuredVideoImageUrl ? `<div style="margin-bottom: 25px; text-align: center;"><a href="${urlForEmail}" target="_blank" style="display: inline-block; text-decoration: none;"><img src="${featuredVideoImageUrl}" alt="Featured video for ${reelTitle}" style="max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #dddddd; display: block;" /></a></div>` : ''}
          <div style="text-align: center; margin-bottom: 30px;"><a href="${urlForEmail}" target="_blank" style="background-color: #162bf4; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Watch the reel</a></div>
          <p style="margin-bottom: 5px; font-size: 15px;">Thanks & Cheers,</p><p style="margin-bottom: 0; font-size: 16px; font-weight: bold; color: #162bf4;">HOBBY</p>
        </div>
        <p style="font-size: 11px; color: #888888; text-align: center; margin-top: 15px;">If the button or image doesn't work, copy and paste this link into your browser: ${urlForEmail} <br/>Email content and styling may vary by email client.</p>
      </div>`;

    const mailtoLink = `mailto:${recipientEmail}?subject=${subject}&body=${encodeURIComponent(emailBodyHtml)}`;
    if (mailtoLink.length > 2000) {
      const simpleBody = encodeURIComponent(`Hi there,\n\n${reelDescription ? reelDescription + '\n\n' : ''}Here is "${reelTitle}" for you! Enjoy\n\nWatch the reel: ${urlForEmail}\n\nThanks & Cheers,\nHOBBY`);
      window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${simpleBody}`;
    } else {
      window.location.href = mailtoLink;
    }
    setEmailFeedback('Your email client should open. If not, please check pop-up blockers.');
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCreateGistLink = async () => {
    if (!reelData) {
      setGistError("Reel data is not available to create a shareable link.");
      return;
    }
    setIsCreatingGist(true);
    setGistError(null);
    setGeneratedGistUrl(null);

    try {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Hobby Showreel Data: ${reelData.directorName} X ${reelData.brandName}`,
          public: true,
          files: { [`showreel-${reelData.id || Date.now()}.json`]: { content: JSON.stringify(reelData) } },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let customErrorMessage = `Failed to create shareable link (Gist). Status: ${response.status}.`;
        if (response.status === 401) {
          customErrorMessage += ` The Gist service requires authentication, which is not configured for this anonymous link creation method. This feature may be temporarily unavailable or restricted.`;
        } else if (response.status === 403) {
          customErrorMessage += ` The request was forbidden by the Gist service, possibly due to rate limits or permission issues for unauthenticated requests. Please try again later.`;
        } else {
          customErrorMessage += ` ${errorData.message || 'An unexpected error occurred. Please try again.'}`;
        }
        throw new Error(customErrorMessage);
      }
      const gist = await response.json();
      if (gist.id) {
        setGeneratedGistUrl(`${window.location.origin}${window.location.pathname}#/reel/gist/${gist.id}`);
      } else {
        throw new Error("Failed to get ID from Gist response.");
      }
    } catch (error: any) {
      console.error("Error creating Gist:", error);
      setGistError(error.message || "An unknown error occurred while creating the Gist link.");
    } finally {
      setIsCreatingGist(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="share-modal-title"
    >
      <div className={`p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg relative border border-current/20 ${designStyle.pageBgColor} ${designStyle.primaryTextColor}`}>
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${designStyle.primaryTextColor} ${designStyle.hoverTextColor}`}
          aria-label="Close share dialog"
          title="Close"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <h2 id="share-modal-title" className={`text-2xl font-bold mb-1 text-center ${designStyle.primaryTextColor}`}>Share Showreel</h2>
        <p className={`text-sm mb-6 text-center truncate ${designStyle.primaryTextColor} opacity-80`} title={reelTitle}>
          "{reelTitle}"
        </p>

        {/* Universal Gist Link Section - Generation or Display */}
        {!isGistView && !generatedGistUrl && reelData && (
          <div className="mb-6 pb-6 border-b border-current/20">
            <h3 className={`text-md font-semibold mb-1.5 ${designStyle.primaryTextColor}`}>Make it Shareable with Anyone</h3>
            <p className={`text-xs mb-2 ${designStyle.primaryTextColor} opacity-70`}>
              This creates a public link by saving a snapshot of the reel. Anyone with this link can view it. Updates to the reel require generating a new link.
            </p>
            <button
              onClick={handleCreateGistLink}
              disabled={isCreatingGist}
              className="group bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1.5 text-sm w-full justify-center disabled:opacity-70"
              title="Generate a public, universally viewable link for this reel"
            >
              {isCreatingGist ? <LoadingSpinnerIcon className="w-4 h-4 mr-2" /> : <GlobeIcon className="w-4 h-4 text-white" />}
              <span>{isCreatingGist ? 'Generating Link...' : 'Generate Universal Link'}</span>
            </button>
            {gistError && <p className="text-xs text-red-500 mt-1.5">{gistError}</p>}
          </div>
        )}

        {/* Display Universal Link if available */}
        {universalLinkToShow && (
          <div className="mb-6">
            <label htmlFor="universalLink" className={`block text-sm font-semibold mb-1.5 ${designStyle.primaryTextColor}`}>
              Universal Shareable Link:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                id="universalLink"
                value={universalLinkToShow}
                readOnly
                className={`flex-grow p-2.5 border border-current/40 rounded-lg bg-transparent ${designStyle.primaryTextColor} text-sm truncate focus:outline-none placeholder-current/60`}
                title="Universal Showreel URL (read-only)"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => handleCopyToClipboard(universalLinkToShow)}
                className="group bg-brand-blue text-white font-semibold px-3 py-2.5 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-colors flex items-center space-x-1.5 text-sm"
                title="Copy Universal Link"
              >
                <CopyIcon className="w-4 h-4 text-white group-hover:text-brand-lime" />
                <span>Copy</span>
              </button>
            </div>
            {copyFeedback === 'Link copied to clipboard!' && universalLinkToShow && <p className="text-xs text-green-600 mt-1.5">{copyFeedback}</p>}
          </div>
        )}
        
        {/* Display Local Link Fallback if Gist failed */}
        {showLocalLinkFallback && (
           <div className="mb-6">
            <label htmlFor="localLink" className={`block text-sm font-semibold mb-1.5 ${designStyle.primaryTextColor}`}>
              Local Session Link:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                id="localLink"
                value={reelUrl}
                readOnly
                className={`flex-grow p-2.5 border border-current/40 rounded-lg bg-transparent ${designStyle.primaryTextColor} text-sm truncate focus:outline-none placeholder-current/60`}
                title="Local Session URL (read-only)"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => handleCopyToClipboard(reelUrl)}
                className="group bg-brand-blue text-white font-semibold px-3 py-2.5 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-colors flex items-center space-x-1.5 text-sm"
                title="Copy Local Link"
              >
                <CopyIcon className="w-4 h-4 text-white group-hover:text-brand-lime" />
                <span>Copy</span>
              </button>
            </div>
             <p className={`text-xs mt-1.5 ${designStyle.primaryTextColor} opacity-70`}>
                <strong>Note:</strong> This local link will only work in your current browser session. For wider sharing, try generating the "Universal Link" again later, or contact support if issues persist.
            </p>
            {copyFeedback === 'Link copied to clipboard!' && !universalLinkToShow && <p className="text-xs text-green-600 mt-1.5">{copyFeedback}</p>}
            {copyFeedback && copyFeedback.includes('Failed') && <p className="text-xs text-red-500 mt-1.5">{copyFeedback}</p>}
          </div>
        )}


        {/* Share via Email Section */}
        <div className={`border-t border-current/20 pt-6 ${!(universalLinkToShow || showLocalLinkFallback) ? 'opacity-50' : ''}`}>
          <label htmlFor="recipientEmail" className={`block text-sm font-semibold mb-1.5 ${designStyle.primaryTextColor}`}>
            Share via Email:
          </label>
          <p className={`text-xs mb-2 ${designStyle.primaryTextColor} opacity-70`}>
            {universalLinkToShow ? "Uses the Universal Link." : (showLocalLinkFallback ? "Uses the Local Session Link (with limitations)." : "Generate or ensure a link is available above to enable email sharing.")}
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="email"
              id="recipientEmail"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Recipient's email address"
              className={`flex-grow p-2.5 border border-current/50 rounded-lg focus:ring-1 focus:ring-current outline-none transition-all bg-transparent ${designStyle.primaryTextColor} placeholder-current/60 text-sm`}
              title="Enter recipient's email"
              disabled={!(universalLinkToShow || showLocalLinkFallback)}
            />
            <button
              onClick={handleShareViaEmail}
              className="group bg-brand-blue text-white font-semibold px-3 py-2.5 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-colors flex items-center space-x-1.5 text-sm disabled:opacity-60"
              title={ (universalLinkToShow || showLocalLinkFallback) ? "Prepare Email (opens your email client)" : "A shareable link must be available first"}
              disabled={!(universalLinkToShow || showLocalLinkFallback)}
            >
              <MailIcon className="w-4 h-4 text-white group-hover:text-brand-lime" />
              <span>Email</span>
            </button>
          </div>
          {emailFeedback && (
            <p className={`text-xs mt-1.5 ${emailFeedback.includes('valid') || emailFeedback.includes('Please enter') ? 'text-red-500' : `${designStyle.primaryTextColor} opacity-80`}`}>
              {emailFeedback}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;