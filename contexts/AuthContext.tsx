import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD_PROTOTYPE } from '../constants';

// CurrentUserDisplay stored in context/localStorage omits passwordHash but includes role
type CurrentUserDisplay = Omit<User, 'passwordHash'> & { role: UserRole };

interface AuthContextType {
  currentUser: CurrentUserDisplay | null;
  login: (email: string, password_NOT_SECURE: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password_NOT_SECURE: string) => Promise<void>;
  inviteUser: (name: string, email: string, password_NOT_SECURE: string, role: UserRole) => Promise<void>;
  getRegisteredUsers: () => Omit<User, 'passwordHash'>[];
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin user - NOT used for initial state anymore
const INITIAL_ADMIN_USER_SETUP: User = {
  id: ADMIN_EMAIL.toLowerCase(),
  name: 'Administrator',
  email: ADMIN_EMAIL,
  passwordHash: `hashed_${DEFAULT_ADMIN_PASSWORD_PROTOTYPE}_insecure_demo`,
  role: 'admin',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUserDisplay | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]); // Initialize as empty array
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    try {
      const storedUser = localStorage.getItem('currentUser_hobbyReel');
      if (storedUser) {
        const parsedUser: CurrentUserDisplay = JSON.parse(storedUser);
        // Ensure the loaded user also gets admin privileges for this testing phase
        setCurrentUser({ ...parsedUser, role: 'admin' });
      }
    } catch (e) {
      console.error("Error reading user from localStorage", e);
      localStorage.removeItem('currentUser_hobbyReel'); // Clear corrupted item
    }
    setIsLoading(false);
  }, []);

  const signup = async (name: string, email: string, password_NOT_SECURE: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Simulate async operation
        const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        if (existingUser) {
          setError('Email already registered.');
          setIsLoading(false);
          reject(new Error('Email already registered.'));
          return;
        }
        const newUser: User = {
          id: email.toLowerCase().trim(),
          name: name.trim(),
          email: email.toLowerCase().trim(),
          // INSECURE: Store plain text for prototype login, or a very simple "hash"
          passwordHash: `hashed_${password_NOT_SECURE}_insecure_demo`,
          role: 'rep', // New signups are 'rep' but will be elevated to admin on login for now
        };
        setRegisteredUsers(prev => [...prev, newUser]);

        // For testing: log in the new user as admin immediately
        const userForDisplay: CurrentUserDisplay = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: 'admin', // Elevate to admin for session
        };
        setCurrentUser(userForDisplay);
        localStorage.setItem('currentUser_hobbyReel', JSON.stringify(userForDisplay));
        setIsLoading(false);
        resolve();
      }, 500);
    });
  };

  const inviteUser = async (name: string, email: string, password_NOT_SECURE: string, role: UserRole): Promise<void> => {
    setError(null);
    if (currentUser?.role !== 'admin') {
      const errMsg = "Unauthorized: Only admins can invite users.";
      setError(errMsg);
      throw new Error(errMsg);
    }
    const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existingUser) {
      const errMsg = 'Email already registered by another user.';
      setError(errMsg);
      throw new Error(errMsg);
    }
    const newUser: User = {
      id: email.toLowerCase().trim(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: `hashed_${password_NOT_SECURE}_insecure_demo`,
      role,
    };
    setRegisteredUsers(prev => [...prev, newUser]);
    return Promise.resolve();
  };

  const login = async (email: string, password_NOT_SECURE: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Simulate async operation
        const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        // INSECURE: Direct password check for prototype
        if (user && user.passwordHash === `hashed_${password_NOT_SECURE}_insecure_demo`) {
          const userForDisplay: CurrentUserDisplay = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'admin', // Elevate to admin for this session
          };
          setCurrentUser(userForDisplay);
          localStorage.setItem('currentUser_hobbyReel', JSON.stringify(userForDisplay));
          setIsLoading(false);
          resolve();
        } else {
          setError('Invalid email or password.');
          setIsLoading(false);
          reject(new Error('Invalid email or password.'));
        }
      }, 500);
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser_hobbyReel');
    setError(null);
    // No navigation here, navigation should be handled by the component calling logout
  };

  const getRegisteredUsers = (): Omit<User, 'passwordHash'>[] => {
    return registeredUsers.map(u => {
        const { passwordHash, ...userDisplay } = u;
        return userDisplay;
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, signup, isLoading, error, inviteUser, getRegisteredUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};