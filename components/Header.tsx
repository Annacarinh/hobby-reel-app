import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon } from './icons/PlusIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { LogoutIcon } from './icons/LogoutIcon';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth(); 
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 py-1 border-b border-brand-blue/10 bg-brand-pink"> {/* Added bg-brand-pink here */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-1.5 group" title="Go to Homepage">
          <img 
            src="https://i.postimg.cc/SNJtnnyp/Skull-logo-Blue-site-super-small.png" 
            alt="REEL Skull Logo" 
            className="w-6 h-6 object-contain group-hover:opacity-80 transition-opacity"
          />
          <h1 className="text-2xl font-bold text-brand-blue group-hover:opacity-80 transition-opacity">
            REEL
          </h1>
        </Link>
        <nav className="flex items-center gap-x-2 sm:gap-x-3">
          {currentUser ? (
            <>
              <span className="text-xs sm:text-sm text-brand-blue/90 hidden md:inline mr-2">Welcome, {currentUser.name}!</span>
              <Link 
                to="/create" 
                className="group bg-brand-blue text-white font-semibold px-3 py-2 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-all transform hover:scale-105 text-xs sm:text-sm flex items-center space-x-1.5"
                title="Create New Reel"
              >
                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-brand-lime" />
                <span>New Reel</span>
              </Link>
              {currentUser.role === 'admin' && (
                <Link 
                  to="/admin-dashboard" 
                  className="group bg-brand-blue text-white font-semibold px-2 py-2 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-colors text-xs sm:text-sm flex items-center justify-center"
                  title="Admin Dashboard / Settings"
                >
                  <SettingsIcon className="w-5 h-5 text-white group-hover:text-brand-lime" />
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="group bg-brand-blue text-white font-semibold px-2 py-2 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-colors text-xs sm:text-sm flex items-center justify-center"
                title="Logout"
                aria-label="Logout"
              >
                <LogoutIcon className="w-5 h-5 text-white group-hover:text-brand-lime" />
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="bg-brand-blue text-white font-semibold px-3 py-2 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-colors"
                title="Go to Login Page"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-brand-blue text-white font-semibold px-4 sm:px-6 py-2 rounded-lg hover:bg-brand-lime hover:text-brand-blue transition-all transform hover:scale-105"
                title="Go to Sign Up Page"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;