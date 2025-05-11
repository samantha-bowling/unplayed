
import React, { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Info } from "lucide-react";

const SteamPrivacyChecklist = () => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="mb-6 w-full">
      <div className="terminal-box bg-black/50 border border-unplayed-mint/30 rounded-md p-4 text-sm font-mono">
        <div className="flex items-center mb-2">
          <span className="text-unplayed-mint mr-2">🛠</span>
          <span className="text-unplayed-mint font-bold">Before You Log In...</span>
        </div>
        
        <p className="text-gray-300 mb-3">
          Steam hides your game library by default. To make Unplayed work:
        </p>
        
        <ol className="list-decimal list-inside space-y-1 pl-2 text-gray-300">
          <li>Go to your <a 
            href="https://steamcommunity.com/my/edit/settings" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-unplayed-mint underline hover:text-unplayed-mint/80"
          >
            Steam Privacy Settings
          </a></li>
          <li>Click "My Privacy Settings"</li>
          <li>Set "Game details" to Public</li>
          <li>Uncheck "Always keep my total playtime private"</li>
        </ol>
        
        <div className="mt-3 text-gray-300">
          Once done, log in below — we'll grab your backlog!
        </div>
      </div>
      
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="mt-2"
      >
        <div className="flex justify-end">
          <CollapsibleTrigger className="flex items-center text-xs text-unplayed-mint hover:underline">
            <Info className="h-3 w-3 mr-1" />
            Why do we need this?
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-2 text-xs text-gray-400 bg-black/30 p-3 rounded">
          <p className="mb-2">
            Unplayed needs to see your Steam library to help you discover games you own but haven't played.
          </p>
          <p className="mb-2">
            Due to Steam's default privacy settings, your game library and playtime data are hidden from third-party apps like ours.
          </p>
          <p>
            We only access the games you own and your playtime - nothing else. You can change these settings back anytime.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default SteamPrivacyChecklist;
