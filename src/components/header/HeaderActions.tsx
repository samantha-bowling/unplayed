
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FullScreenModeToggle from '../FullScreenModeToggle';
import DiscordIcon from '../icons/DiscordIcon';

const HeaderActions = () => {
  return (
    <div className="flex items-center space-x-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 p-0 flex items-center justify-center bg-black/50 border-gray-700 hover:bg-black/70"
              asChild
            >
              <a 
                href="https://discord.gg/YHbr3Ska95" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Join our Discord"
              >
                <DiscordIcon size={18} />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Join our Discord</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <FullScreenModeToggle />
    </div>
  );
};

export default HeaderActions;
