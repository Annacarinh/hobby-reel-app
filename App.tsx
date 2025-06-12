import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateReelPage from './pages/CreateReelPage';
import ViewReelPage from './pages/ViewReelPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom'; // For redirecting if not logged in
import { Showreel } from './types';

const ProtectedContent: React.FC<{children: React.ReactNode}> = ({children}) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="text-center py-10 text-brand-blue">Authenticating...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};


const AppContent: React.FC = () => {
  const location = useLocation();
  const { currentUser, isLoading } = useAuth(); // Get currentUser to decide on header/footer display
  const [allShowreels, setAllShowreels] = useState<Showreel[]>([]);

  // Conditionally show header/footer only if not on view reel page AND (user is logged in OR on login/signup page)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const showHeaderFooter = !location.pathname.startsWith('/reel/') && (currentUser || isAuthPage);
  const isViewReelPage = location.pathname.startsWith('/reel/');
  
  const appBgColor = isViewReelPage ? 'bg-transparent' : 'bg-brand-pink';

  if (isLoading && !isAuthPage && !currentUser) { // Show a global loading if not on auth page and not yet decided
    return <div className={`flex flex-col min-h-screen ${appBgColor} text-brand-blue items-center justify-center`}><p>Loading Application...</p></div>;
  }


  return (
    <div className={`flex flex-col min-h-screen ${appBgColor} text-brand-blue`}>
      {showHeaderFooter && <Header />}
      <main 
        className={`flex-grow ${isViewReelPage ? '' : 'container mx-auto'} ${isViewReelPage ? 'px-0' : 'px-4'} ${showHeaderFooter ? 'py-8' : 'py-0'}`}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} /> 
          <Route 
            path="/" 
            element={
              <ProtectedContent>
                <HomePage allShowreels={allShowreels} setAllShowreels={setAllShowreels} />
              </ProtectedContent>
            } 
          />
          <Route path="/reel/:reelId" element={<ViewReelPage allShowreels={allShowreels} />} />
          <Route path="/reel/gist/:gistId" element={<ViewReelPage allShowreels={[]} isGistView={true} />} />
          <Route 
            path="/create" 
            element={
              <ProtectedContent>
                <CreateReelPage allShowreels={allShowreels} setAllShowreels={setAllShowreels} />
              </ProtectedContent>
            } 
          />
          <Route 
            path="/edit/:reelId" 
            element={
              <ProtectedContent>
                <CreateReelPage editMode={true} allShowreels={allShowreels} setAllShowreels={setAllShowreels} />
              </ProtectedContent>
            } 
          />
          <Route 
            path="/admin-dashboard"
            element={
              <ProtectedContent>
                <AdminDashboardPage /> 
              </ProtectedContent>
            }
          />
        </Routes>
      </main>
      {showHeaderFooter && <Footer />}
    </div>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;