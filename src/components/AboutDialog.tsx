
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  console.log("AboutDialog render: open =", open);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-unplayed-mint">ℹ️ About</span>
            <span className="text-unplayed-pink">Unplayed.wtf</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-gray-300 space-y-4 mt-4">
          <p className="text-lg">
            Got 400 games in your Steam library and no idea what to play? (Yeah, same.)
          </p>
          
          <p>
            Unplayed is your guilt-free sidekick for the eternal backlog struggle.
          </p>
          
          <p>
            We help you embrace the chaos, pick something at random, and maybe—just maybe—finally play that game you bought 6 Steam sales ago.
          </p>
          
          <p>
            No pressure. No judgment. Just good ol' fashioned PC gaming indecision at it's finest. Or worst. That's for you to decide. (If not, no worries.)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;
