
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const NavigationLinks = () => {
  const { user } = useAuth();

  return (
    <>
      <NavLink href="/" label="Dashboard" />
      {user && (
        <>
          <NavLink href="/library" label="Library" />
          <NavLink href="/dust" label="Dust Score" />
          <NavLink href="/spend" label="Spending" />
        </>
      )}
      <NavLink href="/leaderboard" label="Leaderboard" />
    </>
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

export default NavigationLinks;
