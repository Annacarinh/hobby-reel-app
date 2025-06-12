

import React, { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Showreel, User, UserRole } from '../types'; 
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { useAuth } from '../contexts/AuthContext'; 
import useLocalStorage from '../hooks/useLocalStorage'; 
import { ABOUT_HOBBY_CONTENT_KEY, DEFAULT_ABOUT_HOBBY_TEXT, ABOUT_HOBBY_GIF_URL_KEY, DEFAULT_ABOUT_HOBBY_GIF_URL } from '../constants';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EyeIcon } from '../components/icons/EyeIcon'; // For password toggle

type DisplayUserWithRole = Omit<User, 'passwordHash'>;

interface UserActivity { 
  user: DisplayUserWithRole;
  showreels: Showreel[];
  reelCount: number;
}

const VIMEO_TOKEN_KEY = 'vimeo_access_token_PROTOTYPE';

const AdminDashboardPage: React.FC = () => { 
  const { currentUser, isLoading: authIsLoading, inviteUser, getRegisteredUsers } = useAuth();
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [pageSpecificLoading, setPageSpecificLoading] = useState(true); 
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Vimeo Token State
  const [vimeoToken, setVimeoToken] = useLocalStorage<string>(VIMEO_TOKEN_KEY, '');
  const [tempVimeoToken, setTempVimeoToken] = useState<string>('');
  const [tokenSaveMessage, setTokenSaveMessage] = useState<string>('');

  // About Hobby Section State
  const [aboutHobbyContent, setAboutHobbyContent] = useLocalStorage<string>(ABOUT_HOBBY_CONTENT_KEY, DEFAULT_ABOUT_HOBBY_TEXT);
  const [tempAboutHobbyContent, setTempAboutHobbyContent] = useState<string>(DEFAULT_ABOUT_HOBBY_TEXT);
  const [aboutHobbyGifUrl, setAboutHobbyGifUrl] = useLocalStorage<string>(ABOUT_HOBBY_GIF_URL_KEY, DEFAULT_ABOUT_HOBBY_GIF_URL);
  const [tempAboutHobbyGifUrl, setTempAboutHobbyGifUrl] = useState<string>(DEFAULT_ABOUT_HOBBY_GIF_URL);
  const [aboutHobbySaveMessage, setAboutHobbySaveMessage] = useState<string>('');

  // User Invitation State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('rep');
  const [inviteMessage, setInviteMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredUsersForDisplay, setRegisteredUsersForDisplay] = useState<DisplayUserWithRole[]>([]);


  useEffect(() => {
    if (vimeoToken) setTempVimeoToken(vimeoToken); 
  }, [vimeoToken]);

  useEffect(() => setTempAboutHobbyContent(aboutHobbyContent), [aboutHobbyContent]);
  useEffect(() => setTempAboutHobbyGifUrl(aboutHobbyGifUrl), [aboutHobbyGifUrl]);

  const refreshUsersData = () => {
    if (currentUser?.role === 'admin') {
      try {
        const storedShowreels = localStorage.getItem('showreels');
        const allShowreels: Showreel[] = storedShowreels ? JSON.parse(storedShowreels) : [];
        
        const allRegisteredUsersList = getRegisteredUsers();
        setRegisteredUsersForDisplay(allRegisteredUsersList);

        const activities: UserActivity[] = allRegisteredUsersList.map(regUser => {
          const userShowreels = allShowreels.filter(sr => sr.userId === regUser.id);
          return {
            user: regUser,
            showreels: userShowreels,
            reelCount: userShowreels.length,
          };
        });
        setUserActivities(activities);
      } catch (error) {
        console.error("Error processing user data or showreels from localStorage:", error);
        setUserActivities([]);
        setRegisteredUsersForDisplay([]);
      }
    }
  };


  useEffect(() => {
    setPageSpecificLoading(true);
    if (!authIsLoading) {
      if (currentUser?.role === 'admin') {
        setIsAuthorized(true);
        refreshUsersData();
      } else {
        setIsAuthorized(false);
        // Optionally, redirect or show an unauthorized message if not handled by ProtectedContent
      }
      setPageSpecificLoading(false);
    }
  }, [currentUser, authIsLoading, getRegisteredUsers]); // Added getRegisteredUsers dependency

  const handleVimeoTokenSave = (e: FormEvent) => {
    e.preventDefault();
    setVimeoToken(tempVimeoToken);
    setTokenSaveMessage('Vimeo token updated successfully!');
    setTimeout(() => setTokenSaveMessage(''), 3000);
  };

  const handleAboutHobbySave = (e: FormEvent) => {
    e.preventDefault();
    setAboutHobbyContent(tempAboutHobbyContent);
    setAboutHobbyGifUrl(tempAboutHobbyGifUrl);
    setAboutHobbySaveMessage('About HOBBY section updated successfully!');
    setTimeout(() => setAboutHobbySaveMessage(''), 3000);
  };

  const handleInviteUser = async (e: FormEvent) => {
    e.preventDefault();
    setInviteMessage(null);
    if (!inviteName || !inviteEmail || !invitePassword) {
      setInviteMessage({ type: 'error', text: 'All fields are required for invitation.' });
      return;
    }
    try {
      await inviteUser(inviteName, inviteEmail, invitePassword, inviteRole);
      setInviteMessage({ type: 'success', text: `User ${inviteName} (${inviteEmail}) invited successfully as ${inviteRole}.` });
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('rep');
      refreshUsersData(); // Refresh the list of users
    } catch (error: any) {
      setInviteMessage({ type: 'error', text: error.message || 'Failed to invite user.' });
    }
  };

  if (authIsLoading || pageSpecificLoading) {
    return <div className="text-center py-10 text-brand-blue">Loading Admin Dashboard...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="text-center py-10 text-brand-blue">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="mt-2">You do not have permission to view this page.</p>
        <Link to="/" className="mt-4 inline-block bg-brand-blue text-white px-4 py-2 rounded hover:bg-brand-lime hover:text-brand-blue">
          Go to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between pb-4 border-b border-brand-blue/10">
        <Link
          to="/"
          className="group flex items-center bg-brand-blue text-white font-semibold px-3 py-2 rounded-md hover:bg-brand-lime hover:text-brand-blue transition-opacity"
          title="Go Back to Homepage"
        >
          <ChevronLeftIcon className="w-6 h-6 mr-1 text-white group-hover:text-brand-lime" />
          Back
        </Link>
        <h1 className="text-3xl font-bold text-brand-blue text-center flex-grow">Admin Dashboard</h1>
        <div className="w-20"></div> {/* Spacer for balance */}
      </div>

      {/* Vimeo Token Configuration */}
      <section className="p-6 border border-brand-blue/20 rounded-xl bg-brand-pink/10 shadow">
        <h2 className="text-2xl font-semibold text-brand-blue mb-4">Vimeo API Configuration</h2>
        <form onSubmit={handleVimeoTokenSave} className="space-y-4">
          <div>
            <label htmlFor="vimeoToken" className="block text-sm font-medium text-brand-blue mb-1">
              Vimeo Personal Access Token
            </label>
            <input
              type="password"
              id="vimeoToken"
              value={tempVimeoToken}
              onChange={(e) => setTempVimeoToken(e.target.value)}
              className="w-full p-2.5 border border-brand-blue/40 rounded-md focus:ring-1 focus:ring-brand-blue outline-none bg-transparent focus:bg-brand-pink/10 text-brand-blue placeholder-brand-blue/50"
              placeholder="Enter your Vimeo token"
            />
             <p className="text-xs text-brand-blue/70 mt-1">
              Ensure token has scopes: <strong>public, private, video_files</strong>.
            </p>
          </div>
          <button
            type="submit"
            className="bg-brand-blue text-white font-semibold px-5 py-2 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-colors"
          >
            Save Vimeo Token
          </button>
          {tokenSaveMessage && <p className="text-sm text-green-600 mt-2">{tokenSaveMessage}</p>}
        </form>
      </section>

      {/* About HOBBY Section Customization */}
      <section className="p-6 border border-brand-blue/20 rounded-xl bg-brand-pink/10 shadow">
        <h2 className="text-2xl font-semibold text-brand-blue mb-4">"About HOBBY" Section (Footer Area)</h2>
        <form onSubmit={handleAboutHobbySave} className="space-y-4">
          <div>
            <label htmlFor="aboutHobbyContent" className="block text-sm font-medium text-brand-blue mb-1">
              Content / Description
            </label>
            <textarea
              id="aboutHobbyContent"
              value={tempAboutHobbyContent}
              onChange={(e) => setTempAboutHobbyContent(e.target.value)}
              rows={6}
              className="w-full p-2.5 border border-brand-blue/40 rounded-md focus:ring-1 focus:ring-brand-blue outline-none bg-transparent focus:bg-brand-pink/10 text-brand-blue placeholder-brand-blue/50"
              placeholder="Enter content for the 'About HOBBY' section."
            />
          </div>
          <div>
            <label htmlFor="aboutHobbyGifUrl" className="block text-sm font-medium text-brand-blue mb-1">
              Image/GIF URL (Optional)
            </label>
            <input
              type="url"
              id="aboutHobbyGifUrl"
              value={tempAboutHobbyGifUrl}
              onChange={(e) => setTempAboutHobbyGifUrl(e.target.value)}
              className="w-full p-2.5 border border-brand-blue/40 rounded-md focus:ring-1 focus:ring-brand-blue outline-none bg-transparent focus:bg-brand-pink/10 text-brand-blue placeholder-brand-blue/50"
              placeholder="https://example.com/hobby-image.gif"
            />
            {tempAboutHobbyGifUrl && (
              <img src={tempAboutHobbyGifUrl} alt="About Hobby GIF Preview" className="mt-2 max-w-xs max-h-32 object-contain border border-brand-blue/20 rounded" />
            )}
          </div>
          <button
            type="submit"
            className="bg-brand-blue text-white font-semibold px-5 py-2 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-colors"
          >
            Save "About HOBBY" Content
          </button>
          {aboutHobbySaveMessage && <p className="text-sm text-green-600 mt-2">{aboutHobbySaveMessage}</p>}
        </form>
      </section>
      
      {/* User Management Section */}
      <section className="p-6 border border-brand-blue/20 rounded-xl bg-brand-pink/10 shadow">
        <h2 className="text-2xl font-semibold text-brand-blue mb-4">User Management</h2>
        
        {/* Invite User Form */}
        <div className="mb-8 p-4 border border-brand-blue/15 rounded-lg bg-brand-pink/5">
          <h3 className="text-xl font-medium text-brand-blue mb-3">Invite New User</h3>
          <form onSubmit={handleInviteUser} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="inviteName" className="block text-xs font-medium text-brand-blue mb-0.5">Full Name</label>
                <input type="text" id="inviteName" value={inviteName} onChange={(e) => setInviteName(e.target.value)} required className="w-full p-2 border border-brand-blue/30 rounded-md text-sm" />
              </div>
              <div>
                <label htmlFor="inviteEmail" className="block text-xs font-medium text-brand-blue mb-0.5">Email</label>
                <input type="email" id="inviteEmail" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required className="w-full p-2 border border-brand-blue/30 rounded-md text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="invitePassword" className="block text-xs font-medium text-brand-blue mb-0.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="invitePassword" 
                    value={invitePassword} 
                    onChange={(e) => setInvitePassword(e.target.value)} 
                    required 
                    className="w-full p-2 border border-brand-blue/30 rounded-md text-sm pr-10" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-brand-blue/70 hover:text-brand-blue"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon className="w-4 h-4"/>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="inviteRole" className="block text-xs font-medium text-brand-blue mb-0.5">Role</label>
                <select id="inviteRole" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} className="w-full p-2 border border-brand-blue/30 rounded-md text-sm bg-transparent">
                  <option value="rep">Representative (rep)</option>
                  <option value="admin">Administrator (admin)</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="group bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1.5 text-sm"
            >
              <PlusIcon className="w-4 h-4 text-white"/>
              <span>Invite User</span>
            </button>
            {inviteMessage && (
              <p className={`text-xs mt-2 ${inviteMessage.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {inviteMessage.text}
              </p>
            )}
          </form>
        </div>

        {/* Registered Users List */}
        <div>
          <h3 className="text-xl font-medium text-brand-blue mb-3">Registered Users & Activity</h3>
          {registeredUsersForDisplay.length === 0 ? (
            <p className="text-brand-blue/80">No users registered yet, or unable to load user data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-blue/20 text-sm">
                <thead className="bg-brand-pink/20">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold text-brand-blue">Name</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold text-brand-blue">Email</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold text-brand-blue">Role</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold text-brand-blue">Showreels Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-blue/10">
                  {userActivities.map(({ user, reelCount }) => (
                    <tr key={user.id}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-brand-blue/90">{user.name}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-brand-blue/90">{user.email}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-brand-blue/90 capitalize">{user.role}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-brand-blue/90 text-center">{reelCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;