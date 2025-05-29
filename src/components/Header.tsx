
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { useAuthPermission } from '@/hooks/use-auth-permission';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { withDemoIndicator } from './withDemoIndicator';
import { useDemoMode } from '@/context/DemoModeContext';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  HOME_ROUTE,
  LIBRARY_ROUTE,
  DUSTSCORE_ROUTE,
  SPEND_ROUTE,
  LEADERBOARD_ROUTE,
  RANDOM_PICKER_ROUTE,
  ADMIN_DASHBOARD_ROUTE,
  ADMIN_QUEUE_MANAGER_ROUTE,
  ADMIN_STEAM_DATA_ROUTE,
  ADMIN_SUPPORT_ROUTE,
  SUPPORT_ROUTE,
  ADMIN_ACCOUNT_DELETIONS_ROUTE
} from '@/config/routes';
import { Menu, X, Library, Award, DollarSign, LineChart, UserPlus, Settings, LogOut, User, Users, ShieldCheck, MousePointer, Database, BarChart2, HelpCircle, UserMinus } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AboutDialog from './AboutDialog';
import AuthModal from './AuthModal';
import { SteamIcon } from './icons/SteamIcon';
import clsx from 'clsx';

// Main header component for navigation
const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { isAdmin } = useAuthPermission();
  const { isDemo, disableDemo } = useDemoMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Function to determine if a route is active
  const isActiveRoute = (routePath: string) => {
    const currentPath = location.pathname;
    if (routePath === HOME_ROUTE) {
      return currentPath === routePath;
    }
    return currentPath.startsWith(routePath);
  };
  
  // Toggle the mobile menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Close the mobile menu
  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLoginClick = () => {
    if (isDemo) {
      disableDemo();
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-90 transition" onClick={closeMenu}>
            <span className="font-extrabold text-xl font-mono">SteamBacklog.app</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <MainNavLinks isAdmin={isAdmin} isActiveRoute={isActiveRoute} closeMenu={closeMenu} />
          </nav>

          {/* Auth / User Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <AboutDialog 
              trigger={
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition"
                        aria-label="About"
                      >
                        <HelpCircle className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>About</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              }
            />
            <UserMenuDesktop 
              user={user} 
              profile={profile} 
              isAdmin={isAdmin} 
              isDemo={isDemo} 
              onLoginClick={handleLoginClick}
              onLogoutClick={signOut}
            />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMenu} 
              className="p-1 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-800"
              aria-label="Menu"
            >
              {menuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-2 space-y-2">
                <MainNavLinks isAdmin={isAdmin} isActiveRoute={isActiveRoute} closeMenu={closeMenu} />
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <UserMenuMobile 
                    user={user}
                    profile={profile}
                    isAdmin={isAdmin}
                    isDemo={isDemo}
                    onLoginClick={handleLoginClick}
                    onLogoutClick={signOut}
                    closeMenu={closeMenu}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
      />
    </header>
  );
};

// MainNavLinks component for both desktop and mobile
const MainNavLinks: React.FC<{
  isAdmin: boolean;
  isActiveRoute: (route: string) => boolean;
  closeMenu: () => void;
}> = ({ isAdmin, isActiveRoute, closeMenu }) => {
  const location = useRouterLocation();
  
  // Navigation items with their icons and routes
  const navItems = [
    { 
      icon: <Library className="h-4 w-4 mr-2" />,
      name: 'Library', 
      route: LIBRARY_ROUTE 
    },
    { 
      icon: <LineChart className="h-4 w-4 mr-2" />,
      name: 'Dust Score', 
      route: DUSTSCORE_ROUTE 
    },
    { 
      icon: <DollarSign className="h-4 w-4 mr-2" />,
      name: 'Spend', 
      route: SPEND_ROUTE 
    },
    { 
      icon: <Award className="h-4 w-4 mr-2" />,
      name: 'Leaderboard', 
      route: LEADERBOARD_ROUTE 
    },
    { 
      icon: <MousePointer className="h-4 w-4 mr-2" />,
      name: 'Random', 
      route: RANDOM_PICKER_ROUTE 
    }
  ];
  
  // Admin navigation items (removed HLTB item)
  const adminItems = [
    { 
      icon: <BarChart2 className="h-4 w-4 mr-2" />,
      name: 'Admin Dashboard', 
      route: ADMIN_DASHBOARD_ROUTE 
    },
    { 
      icon: <Database className="h-4 w-4 mr-2" />,
      name: 'Queue Manager', 
      route: ADMIN_QUEUE_MANAGER_ROUTE 
    },
    { 
      icon: <SteamIcon className="h-4 w-4 mr-2" />,
      name: 'Steam Data', 
      route: ADMIN_STEAM_DATA_ROUTE 
    },
    { 
      icon: <Users className="h-4 w-4 mr-2" />,
      name: 'Support Tickets', 
      route: ADMIN_SUPPORT_ROUTE 
    },
    { 
      icon: <UserMinus className="h-4 w-4 mr-2" />,
      name: 'Account Deletions', 
      route: ADMIN_ACCOUNT_DELETIONS_ROUTE 
    }
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center md:space-x-6 md:space-y-0 space-y-2">
      {navItems.map((item) => (
        <Link 
          key={item.route} 
          to={item.route} 
          className={clsx(
            "flex items-center px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition",
            {
              'bg-gray-100 dark:bg-gray-800 font-medium': isActiveRoute(item.route),
              'text-gray-700 dark:text-gray-300': !isActiveRoute(item.route)
            }
          )}
          onClick={closeMenu}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
      
      {/* Admin section - only visible to admins */}
      {isAdmin && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Admin
          </div>
          {adminItems.map((item) => (
            <Link 
              key={item.route} 
              to={item.route} 
              className={clsx(
                "flex items-center px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition",
                {
                  'bg-gray-100 dark:bg-gray-800 font-medium': isActiveRoute(item.route),
                  'text-gray-700 dark:text-gray-300': !isActiveRoute(item.route)
                }
              )}
              onClick={closeMenu}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
      )}

      {/* Admin Dropdown (Desktop only) */}
      {isAdmin && (
        <div className="hidden md:block relative group">
          <button className="flex items-center px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Admin
          </button>
          <div className="hidden group-hover:block absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              {adminItems.map((item) => (
                <Link 
                  key={item.route} 
                  to={item.route} 
                  className={clsx(
                    "flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition",
                    {
                      'bg-gray-100 dark:bg-gray-800 font-medium': isActiveRoute(item.route),
                      'text-gray-700 dark:text-gray-300': !isActiveRoute(item.route)
                    }
                  )}
                  onClick={closeMenu}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Desktop user menu
const UserMenuDesktop: React.FC<{
  user: any;
  profile: any;
  isAdmin: boolean;
  isDemo: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}> = ({ user, profile, isAdmin, isDemo, onLoginClick, onLogoutClick }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  if (isDemo) {
    return (
      <button 
        onClick={onLoginClick}
        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
      >
        Exit Demo Mode
      </button>
    );
  }
  
  if (!user) {
    return (
      <button 
        onClick={onLoginClick}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
      >
        Login with Steam
      </button>
    );
  }
  
  return (
    <div className="relative">
      <button 
        onClick={() => setUserMenuOpen(!userMenuOpen)} 
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
          {profile?.steam_avatar ? (
            <img src={profile.steam_avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
        <span className="text-sm font-medium">{profile?.steam_name || 'User'}</span>
      </button>
      
      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
          {/* User menu items */}
          <Link 
            to={SUPPORT_ROUTE} 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={() => setUserMenuOpen(false)}
          >
            <div className="flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" />
              Support
            </div>
          </Link>
          
          <button 
            onClick={() => {
              onLogoutClick();
              setUserMenuOpen(false);
            }} 
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <div className="flex items-center">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

// Mobile user menu
const UserMenuMobile: React.FC<{
  user: any;
  profile: any;
  isAdmin: boolean;
  isDemo: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  closeMenu: () => void;
}> = ({ user, profile, isDemo, onLoginClick, onLogoutClick, closeMenu }) => {
  if (isDemo) {
    return (
      <button 
        onClick={() => {
          onLoginClick();
          closeMenu();
        }}
        className="w-full flex items-center px-3 py-2 rounded-md text-sm text-center bg-amber-500 hover:bg-amber-600 text-white justify-center"
      >
        Exit Demo Mode
      </button>
    );
  }
  
  if (!user) {
    return (
      <button 
        onClick={() => {
          onLoginClick();
          closeMenu();
        }}
        className="w-full flex items-center px-3 py-2 rounded-md text-sm text-center bg-blue-600 hover:bg-blue-700 text-white justify-center"
      >
        <SteamIcon className="h-4 w-4 mr-2" />
        Login with Steam
      </button>
    );
  }
  
  return (
    <div className="space-y-2">
      {profile && (
        <div className="flex items-center px-3 py-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 mr-2">
            {profile.steam_avatar ? (
              <img src={profile.steam_avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium">{profile.steam_name}</div>
          </div>
        </div>
      )}
      
      {/* User actions */}
      <Link 
        to={SUPPORT_ROUTE} 
        onClick={closeMenu}
        className="flex items-center px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Support
      </Link>

      <AboutDialog 
        trigger={
          <button className="w-full flex items-center px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-left">
            <HelpCircle className="h-4 w-4 mr-2" />
            About
          </button>
        }
      />
      
      <button 
        onClick={() => {
          onLogoutClick();
          closeMenu();
        }}
        className="flex items-center px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign out
      </button>
    </div>
  );
};

// Export the Header component with demo indicator wrapper
export default withDemoIndicator(Header);
