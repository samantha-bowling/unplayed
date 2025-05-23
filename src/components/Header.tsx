import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DiscordIcon } from 'lucide-react';
import FullScreenModeToggle from './FullScreenModeToggle';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-black/95 backdrop-blur-sm border-b border-unplayed-mint/20 sticky top-0 z-50">
      {/* Mobile menu button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Menu icon */}
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Close icon */}
              <svg className="hidden h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center ml-4">
              <div className="w-8 h-8 bg-unplayed-mint rounded mr-3 flex items-center justify-center">
                <span className="text-black font-bold text-sm">U</span>
              </div>
              <span className="text-white font-bold text-lg">unplayed</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:ml-6 md:space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === "/" 
                  ? "text-unplayed-mint border-b-2 border-unplayed-mint" 
                  : "text-gray-300 hover:text-unplayed-mint"
              }`}
            >
              Dashboard
            </Link>
            
            <Link
              to="/picker"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === "/picker" 
                  ? "text-unplayed-amber border-b-2 border-unplayed-amber" 
                  : "text-gray-300 hover:text-unplayed-amber"
              }`}
            >
              Picker
            </Link>

            <Link
              to="/library"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === "/library" 
                  ? "text-unplayed-pink border-b-2 border-unplayed-pink" 
                  : "text-gray-300 hover:text-unplayed-pink"
              }`}
            >
              Library
            </Link>

            <Link
              to="/leaderboard"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === "/leaderboard" 
                  ? "text-unplayed-mint border-b-2 border-unplayed-mint" 
                  : "text-gray-300 hover:text-unplayed-mint"
              }`}
            >
              Leaderboard
            </Link>

            <a
              href="https://discord.gg/f6nA55Sg4G"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors flex items-center"
            >
              <DiscordIcon className="h-4 w-4 mr-1" />
              Discord
            </a>

            <FullScreenModeToggle />
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex md:items-center md:ml-auto">
            {user ? (
              <button
                onClick={() => signOut()}
                className="bg-unplayed-red hover:bg-unplayed-red/80 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className="bg-unplayed-mint hover:bg-unplayed-mint/80 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
              >
                Sign In / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/95 border-t border-unplayed-mint/20">
          <Link
            to="/"
            className={`block px-3 py-2 text-base font-medium transition-colors ${
              location.pathname === "/" 
                ? "text-unplayed-mint bg-unplayed-mint/10" 
                : "text-gray-300 hover:text-unplayed-mint hover:bg-unplayed-mint/5"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          
          <Link
            to="/picker"
            className={`block px-3 py-2 text-base font-medium transition-colors ${
              location.pathname === "/picker" 
                ? "text-unplayed-amber bg-unplayed-amber/10" 
                : "text-gray-300 hover:text-unplayed-amber hover:bg-unplayed-amber/5"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Picker
          </Link>

          <Link
            to="/library"
            className={`block px-3 py-2 text-base font-medium transition-colors ${
              location.pathname === "/library" 
                ? "text-unplayed-pink bg-unplayed-pink/10" 
                : "text-gray-300 hover:text-unplayed-pink hover:bg-unplayed-pink/5"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Library
          </Link>

          <Link
            to="/leaderboard"
            className={`block px-3 py-2 text-base font-medium transition-colors ${
              location.pathname === "/leaderboard" 
                ? "text-unplayed-mint bg-unplayed-mint/10" 
                : "text-gray-300 hover:text-unplayed-mint hover:bg-unplayed-mint/5"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Leaderboard
          </Link>

          <a
            href="https://discord.gg/f6nA55Sg4G"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-purple-400 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <DiscordIcon className="h-4 w-4 mr-1 inline" />
            Discord
          </a>

          <div className="px-3 py-2">
            <FullScreenModeToggle />
          </div>
          
          {/* Auth section */}
          <div className="mt-4">
            {user ? (
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-4 py-2 text-base font-medium text-white bg-unplayed-red hover:bg-unplayed-red/80 transition-colors rounded"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className="block w-full text-left px-4 py-2 text-base font-medium text-black bg-unplayed-mint hover:bg-unplayed-mint/80 transition-colors rounded"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
