
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useZenMode } from '@/context/ZenModeContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import ZenModeToggle from './ZenModeToggle';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isLoading } = useAuth();
  const { isDemoExplicit, setIsDemoExplicit } = useDemoMode();
  const { isZenMode } = useZenMode();

  // Hide header in zen mode if it's fully activated
  if (isZenMode) {
    return (
      <div className="w-full px-4 py-2 flex justify-end absolute top-0 left-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <ZenModeToggle />
      </div>
    );
  }

  return (
    <header className="w-full px-4 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <Link to="/" className="text-2xl font-space font-bold">
          <span className="text-unplayed-mint">unplayed</span>
          <span className="text-unplayed-pink">.wtf</span>
        </Link>
      </div>

      <div className="hidden md:flex items-center space-x-6">
        <NavLink href="/" label="Dashboard" />
        {user && (
          <>
            <NavLink href="/library" label="Library" />
            <NavLink href="/picker" label="Random Picker" />
          </>
        )}

        {/* Add Zen Mode Toggle to header */}
        <ZenModeToggle />

        {isLoading ? (
          <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
        ) : user ? (
          <div className="flex items-center space-x-4">
            <Avatar className="cursor-pointer border border-unplayed-mint/30">
              {profile?.steam_avatar ? (
                <AvatarImage src={profile.steam_avatar} alt={profile.steam_name} />
              ) : (
                <AvatarFallback className="bg-gray-800 text-unplayed-mint">
                  {profile?.steam_name?.substring(0, 2) || 'UN'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col text-sm">
              <span className="text-gray-300">{profile?.steam_name || 'User'}</span>
              
              {/* Demo Mode toggle for logged-in users */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-400">Preview Mode</span>
                <Switch 
                  checked={isDemoExplicit}
                  onCheckedChange={setIsDemoExplicit}
                  className="scale-75 data-[state=checked]:bg-unplayed-amber"
                />
              </div>
            </div>
            <button onClick={signOut} className="text-unplayed-red hover:text-red-400 transition-colors">
              Logout
            </button>
          </div>
        ) : (
          <Link to="/auth" className="btn-primary">
            Login with Steam
          </Link>
        )}
      </div>

      <div className="md:hidden flex items-center space-x-2">
        <ZenModeToggle />
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
                <NavLink href="/library" label="Library" />
                <NavLink href="/picker" label="Random Picker" />
              </>
            )}
            
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
                  {profile?.steam_name || 'Gamer'}
                </div>
                
                {/* Demo Mode toggle for logged-in users on mobile */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-400">Preview Mode</span>
                  <Switch 
                    checked={isDemoExplicit}
                    onCheckedChange={setIsDemoExplicit}
                    className="scale-75 data-[state=checked]:bg-unplayed-amber"
                  />
                </div>
                
                <button onClick={signOut} className="btn-secondary w-full mt-2">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn-primary w-4/5">
                Login with Steam
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
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
