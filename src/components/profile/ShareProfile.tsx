import { Twitter, MessageCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ShareProfileProps = {
  username: string;
  dustScore: number;
  tagline?: string;
  badge1Text?: string;
  badge2Text?: string;
  profileUrl: string;
};

export function ShareProfile({
  username,
  dustScore,
  tagline,
  badge1Text,
  badge2Text,
  profileUrl,
}: ShareProfileProps) {
  const shareText = `🎮 ${username} on Unplayed\n${dustScore.toLocaleString()} Dust Score${tagline ? `\n"${tagline}"` : ''}${badge1Text ? `\n🏷️ ${badge1Text}` : ''}${badge2Text ? ` • ${badge2Text}` : ''}\n\nCheck it out: ${profileUrl}`;

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRedditShare = () => {
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(`${username}'s Unplayed Profile - ${dustScore.toLocaleString()} Dust Score`)}`;
    window.open(redditUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Copied your profile link! Share it anywhere 🌐');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-2">Share:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="gap-2"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
        <span className="hidden sm:inline">Twitter</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRedditShare}
        className="gap-2"
        aria-label="Share on Reddit"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Reddit</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2"
        aria-label="Copy profile link"
      >
        <Copy className="h-4 w-4" />
        <span className="hidden sm:inline">Copy Link</span>
      </Button>
    </div>
  );
}
