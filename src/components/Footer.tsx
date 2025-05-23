
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DiscordIcon from './icons/DiscordIcon';
import AboutDialog from './AboutDialog';
import HallOfThanks from './HallOfThanks';

const Footer = () => {
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  return (
    <footer className="bg-black/95 border-t border-unplayed-mint/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-8 h-8 bg-unplayed-mint rounded mr-3 flex items-center justify-center">
              <span className="text-black font-bold text-sm">U</span>
            </div>
            <span className="text-white font-bold text-lg">unplayed</span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <button
              onClick={() => setAboutDialogOpen(true)}
              className="text-gray-400 hover:text-unplayed-mint transition-colors"
            >
              About
            </button>
            
            <Link
              to="/support"
              className="text-gray-400 hover:text-unplayed-mint transition-colors"
            >
              Support
            </Link>
            
            <a
              href="https://discord.gg/f6nA55Sg4G"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-purple-400 transition-colors flex items-center"
            >
              <DiscordIcon className="h-4 w-4 mr-1" />
              Discord
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 unplayed. Made with ❤️ for gamers with too many games.
          </p>
          
          <HallOfThanks />
        </div>
      </div>
      
      <AboutDialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen} />
    </footer>
  );
};

export default Footer;
