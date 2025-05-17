
// src/components/SteamLoginButton.tsx
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

interface SteamLoginButtonProps {
  className?: string;
  redirectPath?: string;
  fullWidth?: boolean;
  centered?: boolean;
  disabled?: boolean;
}

const SteamLoginButton = ({
  className = '',
  redirectPath = '/',
  fullWidth = false,
  centered = true,
  disabled = false,
}: SteamLoginButtonProps) => {
  const { user, isLoading } = useAuth();
  const [buttonLoading, setButtonLoading] = useState(false);

  // Return null to effectively remove the button from rendering anywhere
  return null;
};

export default SteamLoginButton;
