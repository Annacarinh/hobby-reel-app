import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FilmIcon } from '../components/icons/FilmIcon';

const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signup, currentUser, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && currentUser) {
      navigate('/'); 
    }
  }, [currentUser, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageError(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setPageError('All fields are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setPageError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setPageError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setPageError('Passwords do not match.');
      return;
    }

    try {
      await signup(name.trim(), email.trim(), password);
      navigate('/'); 
    } catch (err: any) {
      setPageError(err.message || "Sign up failed. The email might already be in use.");
    }
  };

  if (isLoading && !currentUser) { // Ensure loading state doesn't persist if already navigated
    return <div className="text-center py-10 text-brand-blue">Loading...</div>;
  }
  
  // This check might be redundant due to useEffect but ensures no flash of content
  if (currentUser) { 
    navigate("/"); // Should be handled by useEffect, but as a safeguard
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] sm:min-h-[calc(100vh-250px)]">
      <div className="w-full max-w-md p-8 space-y-6 border border-brand-blue/20 rounded-xl">
        <div className="text-center">
          <FilmIcon className="w-16 h-16 text-brand-blue mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-brand-blue">Create Account</h2>
          <p className="text-brand-blue/80 mt-2">Join to build amazing showreels as a Representative.</p>
        </div>

        {(pageError || authError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{pageError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name-signup" className="block text-sm font-medium text-brand-blue mb-1">
              Full Name
            </label>
            <input
              id="name-signup"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-brand-blue/50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all bg-transparent focus:bg-brand-pink/20 text-brand-blue placeholder-brand-blue/60"
              placeholder="Your Full Name"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="email-signup" className="block text-sm font-medium text-brand-blue mb-1">
              Email Address
            </label>
            <input
              id="email-signup"
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
            <label htmlFor="password-signup" className="block text-sm font-medium text-brand-blue mb-1">
              Password
            </label>
            <input
              id="password-signup"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-brand-blue/50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all bg-transparent focus:bg-brand-pink/20 text-brand-blue placeholder-brand-blue/60"
              placeholder="Create a password (min. 6 characters)"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="confirm-password-signup" className="block text-sm font-medium text-brand-blue mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-password-signup"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-brand-blue/50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all bg-transparent focus:bg-brand-pink/20 text-brand-blue placeholder-brand-blue/60"
              placeholder="Confirm your password"
              aria-required="true"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-lg font-bold text-white bg-brand-blue hover:bg-brand-lime hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all transform hover:scale-102 disabled:opacity-70"
            >
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-brand-blue/80 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-blue hover:underline">
            Log In
          </Link>
        </p>
        <p className="text-xs text-center text-brand-blue/70 mt-2">
          <span className="font-bold">Prototype Security Notice:</span> Password handling is for demonstration only and NOT secure.
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
