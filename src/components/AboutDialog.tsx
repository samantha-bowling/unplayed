import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Mail } from "lucide-react";
import DiscordIcon from "./icons/DiscordIcon";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-unplayed-mint">ℹ️ About</span>
            <span className="text-unplayed-pink">unplayed.wtf</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Main About Section */}
        <div className="text-sm text-gray-300 space-y-4 mt-4">
          <p className="text-lg">
            Got 400 games in your Steam library and no idea what to play? (Yeah, same.)
          </p>
          
          <p>
            unplayed is your backlog's worst nightmare and your decision fatigue's best friend. It helps you figure out what to play next from your Steam library using actual data—like playtime estimates, genre hoarding tendencies, and the shameful truth about how much you've spent on games you've never even launched.
          </p>
          
          <p>
            We help you embrace the chaos, pick something at random, and maybe—just maybe—finally play that game you bought 6 Steam sales ago. No pressure. No judgment. Just good ol' fashioned PC gaming indecision at it's finest. Or worst. That's for you to decide. (If not, no worries.)
          </p>
        </div>
        
        {/* FAQ Accordion Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-unplayed-amber mb-4">FAQ (Frequently Avoided Questions)</h3>
          
          <Accordion type="single" collapsible className="w-full">

            <AccordionItem value="accuracy">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                How accurate is this?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p>
                  We use Steam's public Web APIs to give you a bird's-eye view of your library. It's not 100% precise, but it's a fun way to look at your data. ¯\(ツ)/¯ Did somebody say unplayed Pizza?
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="supabase">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                What's up with that supabase.unplayed.wtf URL when I login?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p>
                  We use Supabase for our database and authentication. We don't know how it all works exactly. Maybe magic.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="affiliation">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                Is this affiliated with Valve/Steam?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p>
                  Nope. We just love Steam (and its APIs). All trademarks are owned by their respective hoarders—I mean holders.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="dust-score">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                What's the Dust Score™?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p className="mb-2">
                  Your Dust Score is a harsh but honest metric that tells you how crusty your backlog is. The higher the score, the dustier your collection.
                </p>
                <p>
                  We won't tell you exactly how it's calculated (sorcery, mostly), but trust us—it knows.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="clean-score">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                What's the Clean Score™?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p className="mb-2">
                  This one's for the digital Marie Kondos out there. Clean Score is the inverse of Dust Score: it tells you how on top of your library you are.
                </p>
                <p>
                  Think of it as your PC gamer hygiene rating. If it's high, we salute you. If it's low… you probably have 12 physical copies of Half-Life and no idea why.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="spending">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                What's the Spending Estimate based on?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p className="mb-2">
                  That number is calculated based on price data we pull from the Steam Store API. We only count games you haven't played, so it's a nice slap of reality to remind you what that Steam Summer Sale really cost you.
                </p>
                <p>
                  Everything is in USD. Emotional damage not included.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="picker">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                What's up with the random game picker?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p className="mb-2">
                  It's a roulette wheel of responsibility. The picker helps you choose a game from your dusty shelf without the existential dread of making a decision.
                </p>
                <p>
                  Bonus: once it lands on a game, you can hit "Give me a reason" to get a recent positive Steam review for it. It's like peer pressure, but helpful.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="steam-account">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                Why do you need my Steam account?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p className="mb-2">
                  To sync your library and show you what you own. We use Steam OpenID for login—no passwords, no spam, no secret Discord invites.
                </p>
                <p>
                  Everything we show you is based on publicly available data (or with your permission). Your privacy matters more to us than launch day patches.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="demo-mode">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                What's Demo Mode?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p>
                  If you're Steam-shy or just peeking around, Demo Mode lets you experience unplayed with some fake-but-familiar data.
                </p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="more-questions">
              <AccordionTrigger className="text-sm font-medium text-unplayed-mint">
                I have more questions.
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-300">
                <p className="flex items-center gap-1">
                  Cool, we probably have more answers. 
                  <a href="https://discord.gg/YHbr3Ska95" target="_blank" rel="noopener noreferrer" className="flex items-center text-unplayed-pink hover:underline">
                    <DiscordIcon className="h-4 w-4 mr-1" /> Join our Discord server
                  </a> 
                  or email us at 
                  <a href="mailto:unplayed.wtf@gmail.com" className="flex items-center ml-1 text-unplayed-pink hover:underline">
                    <Mail className="h-4 w-4 mr-1" />unplayed.wtf@gmail.com
                  </a>
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Memoize the AboutDialog to prevent unnecessary re-renders
export default memo(AboutDialog);
