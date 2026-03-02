
import { useState } from 'react';
import { Menu, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { useAuthPermission } from '@/hooks/use-auth-permission';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileMenu = ({ isOpen, onToggle }: MobileMenuProps) => {
  const { user, signOut, isLoading } = useAuth();
  const { profile } = useProfile();
  const { isAdmin } = useAuthPermission();
  const navigate = useNavigate();

  return (
    <>
      <button 
        onClick={onToggle} 
        className="text-unplayed-mint p-2"
      >
        <Menu />
      </button>

      {isOpen && (
        <div className="absolute top-16 right-0 left-0 bg-gray-900 border-t border-gray-800 shadow-xl z-50 py-4 md:hidden animate-fade-in">
          <div className="flex flex-col space-y-4 items-center">
            <NavLink href="/" label="Dashboard" onClick={onToggle} />
            {user && (
              <>
                <NavLink href="/library" label="Library" onClick={onToggle} />
                <NavLink href="/dust" label="Dust Score" onClick={onToggle} />
                <NavLink href="/spend" label="Spending" onClick={onToggle} />
                {isAdmin && (
                  <>
                    <NavLink href="/auth-debug" label="Debug" onClick={onToggle} />
                    <NavLink href="/admin/support" label="Admin Support" onClick={onToggle} />
                    <NavLink href="/admin/queue-manager" label="Queue Manager" onClick={onToggle} />
                    <NavLink href="/admin/account-deletions" label="Account Deletions" onClick={onToggle} />
                    <NavLink href="/admin/hltb-data" label="HLTB Data" onClick={onToggle} />
                  </>
                )}
              </>
            )}
            <NavLink href="/leaderboard" label="Leaderboard" onClick={onToggle} />
            
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
              </div>
            ) : (
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
    </>
  );
};

const NavLink = ({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) => (
  <Link 
    to={href} 
    onClick={onClick}
    className="text-gray-300 hover:text-unplayed-mint transition-colors duration-200 py-1"
  >
    {label}
  </Link>
);

export default MobileMenu;
