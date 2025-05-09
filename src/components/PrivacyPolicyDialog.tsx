
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PrivacyPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyPolicyDialog = ({ open, onOpenChange }: PrivacyPolicyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-unplayed-mint">📜 Privacy Policy</span>
            <span className="text-unplayed-pink">– Unplayed.wtf</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Effective Date: May 8, 2025 | Last Updated: May 8, 2025
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-sm text-gray-300 space-y-4 mt-4">
          <p>
            Unplayed ("we", "our", or "us") respects your privacy and is committed to protecting it through this Privacy Policy. 
            This document outlines how we collect, use, and safeguard your data when you use our website and platform (unplayed.wtf).
          </p>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">1. Information We Collect</h3>
            <p className="mb-1"><span className="font-medium text-unplayed-mint">Steam Account Data:</span> When you sign in using Steam, we access your SteamID, display name, profile picture, owned games, playtime, and last played timestamps via the Steam Web API.</p>
            <p className="mb-1"><span className="font-medium text-unplayed-mint">Usage Data:</span> We collect anonymized data about how users interact with the site to improve features and performance (e.g., pages visited, button clicks, time on page).</p>
            <p><span className="font-medium text-unplayed-mint">Cookies:</span> We use minimal cookies for login persistence and session functionality only. No third-party tracking cookies are used.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">2. How We Use Your Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To generate your personalized dashboard and stats.</li>
              <li>To provide core functionality like the Random Game Picker.</li>
              <li>To improve the overall product experience via aggregated, non-personalized usage analytics.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">3. What We Don't Do</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>We do not sell your data.</li>
              <li>We do not display ads or use third-party advertising networks.</li>
              <li>We do not collect sensitive personal data like location, financial information, or contacts.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">4. Data Retention</h3>
            <p>
              We retain only the data required to operate the platform. You may request deletion of your synced data at any time by contacting support@unplayed.wtf.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">5. Children's Privacy</h3>
            <p>
              Unplayed is not intended for children under the age of 13. If we discover we have collected information from a child under 13, we will delete it immediately.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">6. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be announced on our site. Continued use of the service after changes constitutes acceptance.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyDialog;
