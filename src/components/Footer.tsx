
const Footer = () => {
  return (
    <footer className="w-full p-6 mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="text-xl font-space font-bold">
              <span className="text-unplayed-mint">unplayed</span>
              <span className="text-unplayed-pink">.wtf</span>
            </div>
            <p className="text-gray-400 text-sm mt-1">The backlog tamer for PC gamers</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <a href="#" className="text-gray-400 hover:text-unplayed-mint transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-unplayed-mint transition-colors text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-unplayed-mint transition-colors text-sm">
              About
            </a>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-500 text-sm">
          <p>
            Not affiliated with Valve Corporation or Steam. All game images are property of their respective owners.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Unplayed.wtf - All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
