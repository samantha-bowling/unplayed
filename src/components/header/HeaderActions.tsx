
import FullScreenModeToggle from '../FullScreenModeToggle';
import MusicPlayerButton from './MusicPlayerButton';

const HeaderActions = () => {
  return (
    <div className="flex items-center space-x-3">
      <MusicPlayerButton />
      <FullScreenModeToggle />
    </div>
  );
};

export default HeaderActions;
