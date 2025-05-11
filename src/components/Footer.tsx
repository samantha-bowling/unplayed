import { useState } from "react";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import PrivacyPolicyDialog from "./PrivacyPolicyDialog";
import TermsOfServiceDialog from "./TermsOfServiceDialog";
import AboutDialog from "./AboutDialog";
import { Link } from "react-router-dom";

const Footer = () => {
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsOfServiceOpen, setTermsOfServiceOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const {
    isFullScreenMode
  } = useFullScreenMode();
  
  const openPrivacyPolicy = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Opening Privacy Policy dialog");
    setPrivacyPolicyOpen(true);
  };
  
  const openTermsOfService = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Opening Terms of Service dialog");
    setTermsOfServiceOpen(true);
  };
  
  const openAbout = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Opening About dialog");
    setAboutOpen(true);
  };

  // Hide footer in full screen mode
  if (isFullScreenMode) {
    return null;
  }
  
  return <footer className="w-full p-6 mt-16 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-xl font-space font-bold">
              <span className="text-unplayed-mint">unplayed</span>
              <span className="text-unplayed-pink">.wtf</span>
            </Link>
            <p className="text-gray-400 text-sm mt-1">Your Steam library backlog tamer</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <a href="#" className="text-gray-400 hover:text-unplayed-mint transition-colors text-sm" onClick={openPrivacyPolicy}>
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-unplayed-mint transition-colors text-sm" onClick={openTermsOfService}>
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-unplayed-mint transition-colors text-sm" onClick={openAbout}>
              About
            </a>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-500 text-sm">
          <p>
            Not affiliated with Valve Corporation or Steam. All game images are property of their respective owners.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} unplayed.wtf - All rights reserved
          </p>
        </div>
      </div>

      {/* Dialog components with increased z-index */}
      <PrivacyPolicyDialog open={privacyPolicyOpen} onOpenChange={setPrivacyPolicyOpen} />
      <TermsOfServiceDialog open={termsOfServiceOpen} onOpenChange={setTermsOfServiceOpen} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </footer>;
};

export default Footer;
