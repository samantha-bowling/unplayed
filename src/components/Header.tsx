
import { useState } from 'react';
import { Menu } from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full px-4 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="text-2xl font-space font-bold">
          <span className="text-unplayed-mint">unplayed</span>
          <span className="text-unplayed-pink">.wtf</span>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-6">
        <NavLink href="#dashboard" label="Dashboard" />
        <NavLink href="#library" label="Library" />
        <NavLink href="#picker" label="Random Picker" />
        <button className="btn-primary">
          Login with Steam
        </button>
      </div>

      <div className="md:hidden">
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
            <NavLink href="#dashboard" label="Dashboard" />
            <NavLink href="#library" label="Library" />
            <NavLink href="#picker" label="Random Picker" />
            <button className="btn-primary w-4/5">
              Login with Steam
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

const NavLink = ({ href, label }: { href: string; label: string }) => (
  <a 
    href={href} 
    className="text-gray-300 hover:text-unplayed-mint transition-colors duration-200"
  >
    {label}
  </a>
);

export default Header;
