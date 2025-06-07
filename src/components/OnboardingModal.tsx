
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Import, Gamepad2 } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onImportLibrary: () => void;
  steamName?: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  onClose,
  onImportLibrary,
  steamName
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      // Store preference in localStorage
      try {
        localStorage.setItem('unplayed_onboarding_dismissed', 'true');
      } catch (error) {
        console.warn('Failed to save onboarding preference:', error);
      }
    }
    onClose();
  };

  const handleImportAndClose = () => {
    handleClose();
    onImportLibrary();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-unplayed-mint">
            <Gamepad2 className="h-5 w-5" />
            Welcome to unplayed{steamName ? `, ${steamName}` : ''}!
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              Great! Your Steam account is now connected. To see your gaming insights and discover hidden gems in your library, you'll need to import your games.
            </p>
            <p className="text-sm text-muted-foreground">
              This usually takes 1-2 minutes and only needs to be done once.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col gap-4 sm:flex-col">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={setDontShowAgain}
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don't show this message again
            </label>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleImportAndClose}
              className="flex-1 bg-unplayed-pink hover:bg-unplayed-pink/90"
            >
              <Import className="mr-2 h-4 w-4" />
              Import My Library
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
