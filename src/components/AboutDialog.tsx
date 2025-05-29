
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface AboutDialogProps {
  trigger: React.ReactNode;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>About SteamBacklog.app</DialogTitle>
          <DialogDescription>
            Tackle your gaming backlog with powerful insights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 text-sm">
          <p>
            <strong className="text-primary">SteamBacklog.app</strong> helps you manage your Steam
            library by providing analytics and insights about your unplayed games.
          </p>
          
          <div>
            <h3 className="font-bold mb-2">Key Features:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Track unplayed games in your Steam library</li>
              <li>Visualize gaming spending and patterns</li>
              <li>Calculate "Dust Score" for neglected games</li>
              <li>Randomly pick games from your library</li>
              <li>Compare your stats with other players</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-2">How it works:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Connect your Steam account (read-only access)</li>
              <li>We import your library data and playtime</li>
              <li>View insights and analytics on your backlog</li>
            </ol>
          </div>
          
          <p className="text-xs text-gray-500">
            Version 0.9.5-beta | Last updated: May 29, 2025
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" className="w-full">
            <a href="https://steamcommunity.com/dev" target="_blank" rel="noopener noreferrer">
              Steam Web API
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;
