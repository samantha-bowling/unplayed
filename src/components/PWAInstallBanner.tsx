import React from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWA } from '@/hooks/use-pwa';

export const PWAInstallBanner = () => {
  const { isInstallable, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (!isInstallable || isDismissed) return null;

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsDismissed(true);
    }
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-primary/20 bg-background/95 backdrop-blur-sm shadow-lg md:bottom-6 md:left-6 md:right-auto md:max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-sm">Install Unplayed</h3>
            <p className="text-xs text-muted-foreground">
              Add to your home screen for quick access and offline support
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="h-8 text-xs"
              >
                Install
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsDismissed(true)}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};