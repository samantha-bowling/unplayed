
import { useState, useEffect } from 'react';
import { Menu, LogIn, ChevronDown, Settings, Shield, Bug, UserMinus, ActivitySquare, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import FullScreenModeToggle from './FullScreenModeToggle';
import DiscordIcon from './icons/DiscordIcon';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProfile } from '@/hooks/use-profile';
import AccountDeletionModal from './AccountDeletionModal';

// Import dropdown menu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const { user, signOut, isLoading, status } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { isDemoExplicit, setIsDemoExplicit } = useDemoMode();
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

  // Check if user has admin role - only using app_metadata since profile.roles doesn't exist
  const isAdmin = user?.app_metadata?.roles?.includes('admin');

  // Hide header in full screen mode if it's fully activated
  if (isFullScreenMode) {
    return (
      <div className="fixed w-full px-4 py-2 flex justify-end top-0 left-0 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <FullScreenModeToggle />
      </div>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 w-full px-4 py-4 flex items-center justify-between z-50 glass-panel bg-black/60 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-space font-bold">
            <span className="text-unplayed-mint">unplayed</span>
            <span className="text-unplayed-pink">.wtf</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <NavLink href="/" label="Dashboard" />
          {stableRenderState.isAuthenticated && (
            <>
              <NavLink href="/picker" label="Picker" />
              <NavLink href="/library" label="Library" />
              {/* Hide admin links from main navigation when we have the dropdown */}
              {isAdmin && !stableRenderState.hasProfile && (
                <>
                  <NavLink href="/auth-debug" label="Debug" />
                  <NavLink href="/admin/support" label="Admin Support" />
                  <NavLink href="/admin/queue-manager" label="Queue Manager" />
                </>
              )}
            </>
          )}
          <NavLink href="/leaderboard" label="Leaderboard" />
          
          {/* Discord Link with Button styling to match FullScreenModeToggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 p-0 flex items-center justify-center bg-black/50 border-gray-700 hover:bg-black/70"
                  asChild
                >
                  <a 
                    href="https://discord.gg/TvcNPryU8N" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label="Join our Discord"
                  >
                    <DiscordIcon size={18} />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Join our Discord</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <FullScreenModeToggle />

          {stableRenderState.isLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
          ) : stableRenderState.isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {/* If user is admin, wrap avatar in dropdown menu */}
              {isAdmin && stableRenderState.hasProfile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto flex items-center space-x-2 hover:bg-transparent">
                      <Avatar className="border border-unplayed-mint/30 cursor-pointer">
                        {profile?.steam_avatar ? (
                          <AvatarImage src={profile.steam_avatar} alt={profile.steam_name} />
                        ) : (
                          <AvatarFallback className="bg-gray-800 text-unplayed-mint">
                            {profile?.steam_name?.substring(0, 2) || 'UN'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex items-center">
                        <span className="text-gray-300">{profile?.steam_name || 'User'}</span>
                        <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-gray-200">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-unplayed-mint">Admin Controls</span>
                        <span className="text-xs text-gray-400">Manage system settings</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    
                    <DropdownMenuGroup>
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                        onClick={() => navigate('/auth-debug')}
                      >
                        <Bug className="mr-2 h-4 w-4 text-unplayed-mint" />
                        <span>Auth Debug</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                        onClick={() => navigate('/admin/support')}
                      >
                        <Shield className="mr-2 h-4 w-4 text-unplayed-pink" />
                        <span>Admin Support</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                        onClick={() => navigate('/admin/hltb-data')}
                      >
                        <Clock className="mr-2 h-4 w-4 text-purple-400" />
                        <span>HLTB Data</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                        onClick={() => navigate('/admin/account-deletions')}
                      >
                        <UserMinus className="mr-2 h-4 w-4 text-unplayed-red" />
                        <span>Account Deletions</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                        onClick={() => navigate('/admin/queue-manager')}
                      >
                        <ActivitySquare className="mr-2 h-4 w-4 text-blue-400" />
                        <span>Queue Manager</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    
                    <DropdownMenuSeparator className="bg-gray-700" />
                    
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-unplayed-red"
                      onClick={signOut}
                    >
                      <LogIn className="mr-2 h-4 w-4 rotate-180" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Non-admin authenticated user avatar with dropdown (no preview mode toggle)
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto flex items-center space-x-2 hover:bg-transparent">
                      <Avatar className="border border-unplayed-mint/30 cursor-pointer">
                        {stableRenderState.hasProfile && profile?.steam_avatar ? (
                          <AvatarImage src={profile.steam_avatar} alt={profile.steam_name} />
                        ) : (
                          <AvatarFallback className="bg-gray-800 text-unplayed-mint">
                            {profile?.steam_name?.substring(0, 2) || 'UN'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex items-center">
                        <span className="text-gray-300">{profile?.steam_name || 'User'}</span>
                        <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-gray-200">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-unplayed-mint">User Settings</span>
                        <span className="text-xs text-gray-400">Manage your account</span>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator className="bg-gray-700" />
                    
                    {/* Logout Option */}
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                      onClick={signOut}
                    >
                      <LogIn className="mr-2 h-4 w-4 rotate-180" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                    
                    {/* Delete Account Option */}
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-unplayed-red"
                      onClick={() => setShowDeletionModal(true)}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      <span>Delete Account</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ) : (
            // Show login button instead of Steam login
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
              className="flex items-center gap-2 bg-black/50 border-gray-700 hover:bg-black/70"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </Button>
          )}
        </div>

        <div className="md:hidden flex items-center space-x-3">
          {/* Discord Icon for Mobile - Updated to match FullScreenModeToggle */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 p-0 flex items-center justify-center bg-black/50 border-gray-700 hover:bg-black/70"
            asChild
          >
            <a 
              href="https://discord.gg/TvcNPryU8N" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Join our Discord"
            >
              <DiscordIcon size={18} />
            </a>
          </Button>
          
          <FullScreenModeToggle />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="text-unplayed-mint p-2"
          >
            <Menu />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-16 right-0 left-0 glass-panel z-10 py-4 md:hidden animate-fade-in">
            <div className="flex flex-col space-y-4 items-center">
              <NavLink href="/" label="Dashboard" />
              {user && (
                <>
                  <NavLink href="/picker" label="Picker" />
                  <NavLink href="/library" label="Library" />
                  {/* Display admin links in the mobile menu */}
                  {isAdmin && (
                    <>
                      <NavLink href="/auth-debug" label="Debug" />
                      <NavLink href="/admin/support" label="Admin Support" />
                      <NavLink href="/admin/queue-manager" label="Queue Manager" />
                      <NavLink href="/admin/account-deletions" label="Account Deletions" />
                      <NavLink href="/admin/hltb-data" label="HLTB Data" />
                    </>
                  )}
                </>
              )}
              <NavLink href="/leaderboard" label="Leaderboard" />
              
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
              ) : user ? (
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="cursor-pointer border border-unplayed-mint/30">
                    {profile?.steam_avatar ? (
                      <AvatarImage src={profile.steam_avatar} alt={profile.steam_name} />
                    ) : (
                      <AvatarFallback className="bg-gray-800 text-unplayed-mint">
                        {profile?.steam_name?.substring(0, 2) || 'UN'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-sm text-gray-300">
                    {profile?.steam_name || 'User'}
                  </div>
                  
                  <button onClick={signOut} className="btn-secondary w-full mt-2">
                    Logout
                  </button>
                  
                  {/* Delete account button for mobile - removed preview mode toggle */}
                  {!isAdmin && (
                    <button 
                      onClick={() => setShowDeletionModal(true)} 
                      className="text-unplayed-red hover:text-red-400 transition-colors w-full mt-2"
                    >
                      <UserMinus size={16} className="inline mr-1" />
                      Delete Account
                    </button>
                  )}
                </div>
              ) : (
                // Show login button in mobile menu instead of Steam login
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  <LogIn size={16} className="mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </header>
      
      {/* Account deletion modal */}
      <AccountDeletionModal 
        open={showDeletionModal}
        onOpenChange={setShowDeletionModal}
      />
    </>
  );
};

const NavLink = ({ href, label }: { href: string; label: string }) => (
  <Link 
    to={href} 
    className="text-gray-300 hover:text-unplayed-mint transition-colors duration-200"
  >
    {label}
  </Link>
);

export default Header;
