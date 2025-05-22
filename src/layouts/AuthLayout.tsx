
import React from 'react';
import FullScreenModeWrapper from '@/components/FullScreenModeWrapper';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Authentication layout
 * Simplified layout for auth pages with just a logo and content
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center bg-black/95">
        <div className="w-full max-w-md px-6 py-8">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-space font-bold">
                <span className="text-unplayed-mint">unplayed</span>
                <span className="text-unplayed-pink">.wtf</span>
              </h1>
            </Link>
          </div>
          
          {children}
        </div>
      </div>
    </FullScreenModeWrapper>
  );
};

export default AuthLayout;
