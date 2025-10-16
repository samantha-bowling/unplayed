
import { ChevronDown, LogIn, LayoutDashboard, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { useAuthPermission } from '@/hooks/use-auth-permission';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserDropdown = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isAdmin } = useAuthPermission();
  const navigate = useNavigate();

  if (!user || !profile) {
    return (
      <Button 
        onClick={() => navigate('/auth')}
        variant="outline"
        className="flex items-center gap-2 bg-black/50 border-gray-700 hover:bg-black/70"
      >
        <LogIn size={16} />
        <span>Sign In</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-0 h-auto flex items-center space-x-2 hover:bg-transparent">
          <Avatar className="border border-unplayed-mint/30 cursor-pointer">
            {profile.steam_avatar ? (
              <AvatarImage src={profile.steam_avatar} alt={profile.steam_name} />
            ) : (
              <AvatarFallback className="bg-gray-800 text-unplayed-mint">
                {profile?.steam_name?.substring(0, 2) || 'UN'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex items-center">
            <span className="text-gray-300">{profile.steam_name || 'User'}</span>
            <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-gray-200">
        {isAdmin ? (
          <>
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
                onClick={() => navigate('/admin/dashboard')}
              >
                <LayoutDashboard className="mr-2 h-4 w-4 text-unplayed-mint" />
                <span>Admin Dashboard</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : (
          <>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-unplayed-mint">User Settings</span>
                <span className="text-xs text-gray-400">Manage your account</span>
              </div>
            </DropdownMenuLabel>
          </>
        )}
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <User className="mr-2 h-4 w-4 text-unplayed-mint" />
            <span>My Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
          onClick={signOut}
        >
          <LogIn className="mr-2 h-4 w-4 rotate-180" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
