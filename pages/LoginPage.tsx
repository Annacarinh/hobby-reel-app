import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FilmIcon } from '../components/icons/FilmIcon';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, currentUser, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pageError, setPageError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (!isLoading && currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, isLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageError(null); 
    if (email.trim() && password) {
      try {
        await login(email.trim(), password);
      } catch (err: any) {
        setPageError(err.message || "Login failed. Please check your credentials.");
      }
    } else {
      setPageError("Please enter both email and password.");
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-10 text-brand-blue">Loading...</div>;
  }
  
  if (currentUser) { 
    navigate(from, { replace: true });
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] sm:min-h-[calc(100vh-250px)]">
      <div className="w-full max-w-md p-8 space-y-6 border border-brand-blue/20 rounded-xl">
        <div className="text-center">
          <FilmIcon className="w-16 h-16 text-brand-blue mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-brand-blue">Login</h2>
          <p className="text-brand-blue/80 mt-2">Access your showreels.</p>
        </div>
        
        {(pageError || authError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{pageError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-blue mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-brand-blue/50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all bg-transparent focus:bg-brand-pink/20 text-brand-blue placeholder-brand-blue/60"
              placeholder="you@example.com"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brand-blue mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-brand-blue/50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all bg-transparent focus:bg-brand-pink/20 text-brand-blue placeholder-brand-blue/60"
              placeholder="Enter your password"
              aria-required="true"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-lg font-bold text-white bg-brand-blue hover:bg-brand-lime hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all transform hover:scale-102 disabled:opacity-70"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-brand-blue/80 mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-brand-blue hover:underline">
            Sign Up
          </Link>
        </p>
        <p className="text-xs text-center text-brand-blue/70 mt-2">
          <span className="font-bold">Prototype Security Notice:</span> Password handling is for demonstration only and NOT secure.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;