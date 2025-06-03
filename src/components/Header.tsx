
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import FullScreenModeToggle from './FullScreenModeToggle';
import NavigationLinks from './header/NavigationLinks';
import UserDropdown from './header/UserDropdown';
import MobileMenu from './header/MobileMenu';
import HeaderActions from './header/HeaderActions';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const { profile } = useProfile();
  const { isFullScreenMode } = useFullScreenMode();
  
  // Add a stable render state to prevent flickering during auth transitions
  const [stableRenderState, setStableRenderState] = useState({
    isAuthenticated: false,
    isLoading: true,
    hasProfile: false,
  });

  // Update stable render state when auth state changes
  useEffect(() => {
    setStableRenderState({
      isAuthenticated: !!user,
      isLoading,
      hasProfile: !!profile,
    });
  }, [user, profile, isLoading]);

  // Hide header in full screen mode if it's fully activated
  if (isFullScreenMode) {
    return (
      <div className="fixed w-full px-4 py-2 flex justify-end top-0 left-0 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <FullScreenModeToggle />
      </div>
    );
  }

  return (
    <header className="fixed top-0 left-0 w-full px-4 py-4 flex items-center justify-between z-50 glass-panel bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center">
        <Link to="/" className="text-2xl font-space font-bold">
          <span className="text-unplayed-mint">unplayed</span>
          <span className="text-unplayed-pink">.wtf</span>
        </Link>
      </div>

      <div className="hidden md:flex items-center space-x-6">
        <NavigationLinks />
        <HeaderActions />
        
        {stableRenderState.isLoading ? (
          <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
        ) : (
          <UserDropdown />
        )}
      </div>

      <div className="md:hidden flex items-center space-x-3">
        <HeaderActions />
        <MobileMenu 
          isOpen={mobileMenuOpen} 
          onToggle={() => setMobileMenuOpen(!mobileMenuOpen)} 
        />
      </div>
    </header>
  );
};

export default Header;
