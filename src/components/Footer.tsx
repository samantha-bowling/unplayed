
import { useState, useCallback } from "react";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { useAuth } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import PrivacyPolicyDialog from "./PrivacyPolicyDialog";
import TermsOfServiceDialog from "./TermsOfServiceDialog";
import AboutDialog from "./AboutDialog";
import AccountDeletionModal from "./AccountDeletionModal";
import { Link } from "react-router-dom";


const Footer = () => {
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const { isFullScreenMode } = useFullScreenMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use useCallback to prevent unnecessary re-renders
  const openPrivacyPolicy = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPrivacyPolicyOpen(true);
  }, []);
  
  const openTermsOfService = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setTermsOfServiceOpen(true);
  }, []);
  
  const openAbout = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setAboutOpen(true);
  }, []);

  const openDeletionModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowDeletionModal(true);
  }, []);


  // Hide footer in full screen mode
  if (isFullScreenMode) {
    return null;
  }
  
  return (
    <footer className="w-full relative z-10">
      <div className="max-w-7xl mx-auto p-6 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-xl font-space font-bold">
              <span className="text-unplayed-mint">unplayed</span>
              <span className="text-unplayed-pink">.wtf</span>
            </Link>
            <p className="text-gray-400 text-sm mt-1">Your Steam library backlog tamer</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-0 md:space-y-0 md:space-x-6">
            {/* Show Delete Account for authenticated users first */}
            {user && (
              <button className="text-unplayed-red hover:text-red-400 transition-colors text-sm py-2 md:py-0 bg-transparent border-none cursor-pointer" onClick={openDeletionModal}>
                Delete Account
              </button>
            )}
            <button className="text-gray-400 hover:text-unplayed-mint transition-colors text-sm py-2 md:py-0 bg-transparent border-none cursor-pointer" onClick={openPrivacyPolicy}>
              Privacy Policy
            </button>
            <button className="text-gray-400 hover:text-unplayed-mint transition-colors text-sm py-2 md:py-0 bg-transparent border-none cursor-pointer" onClick={openTermsOfService}>
              Terms of Service
            </button>
            <button className="text-gray-400 hover:text-unplayed-mint transition-colors text-sm py-2 md:py-0 bg-transparent border-none cursor-pointer" onClick={openAbout}>
              About
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-500 text-sm">
          <p>
            Not affiliated with Valve Corporation or Steam. All game images are property of their respective owners.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} unplayed - All rights reserved
          </p>
        </div>
      </div>

      {/* Dialog components with React.memo to prevent unnecessary re-renders */}
      {privacyPolicyOpen && <PrivacyPolicyDialog open={privacyPolicyOpen} onOpenChange={setPrivacyPolicyOpen} />}
      {termsOfServiceOpen && <TermsOfServiceDialog open={termsOfServiceOpen} onOpenChange={setTermsOfServiceOpen} />}
      {aboutOpen && <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />}
      {showDeletionModal && <AccountDeletionModal open={showDeletionModal} onOpenChange={setShowDeletionModal} />}
    </footer>
  );
};

export default Footer;
