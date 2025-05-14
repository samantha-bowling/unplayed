
import React from "react";
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
  if (process.env.NODE_ENV === "development") {
    console.log("PrivacyPolicyDialog render: open =", open);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-unplayed-mint">📜 Privacy Policy</span>
            <span className="text-unplayed-pink">– unplayed</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Effective Date: May 8, 2025 | Last Updated: May 10, 2025
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-gray-300 space-y-4 mt-4">
          <p>
            unplayed ("we", "our", or "us") respects your privacy and is committed to
            protecting it through this Privacy Policy. This document outlines how we
            collect, use, and safeguard your data when you use our website and platform
            (unplayed.wtf).
          </p>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">1. Information We Collect</h3>
            <p className="mb-1">
              <span className="font-medium text-unplayed-mint">Steam Account Data:</span> When you sign in using Steam, we access your SteamID,
              display name, avatar, owned games, total and recent playtime, and other
              publicly visible profile information using the official Steam Web API.
            </p>
            <p className="mb-1">
              We do not collect or store your Steam password at any time. Login is
              handled through Steam OpenID.
            </p>
            <p className="mb-1">
              Your Steam data is stored securely on U.S.-based cloud infrastructure
              provided by Supabase.
            </p>
            <p className="mb-1">
              <span className="font-medium text-unplayed-mint">Usage Data:</span> We collect anonymized usage analytics (e.g., pages visited,
              button clicks, time on page) to help improve our platform.
            </p>
            <p>
              <span className="font-medium text-unplayed-mint">Cookies:</span> We use minimal first-party cookies for login sessions and
              platform functionality. No third-party tracking cookies are used.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">2. How We Use Your Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and display your personalized Unplayed dashboard.</li>
              <li>To provide features like the Random Game Picker and Dust Score.</li>
              <li>To improve the platform experience through anonymized usage patterns.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">3. What We Don't Do</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>We do not sell your data.</li>
              <li>We do not run ads or partner with third-party ad networks.</li>
              <li>
                We do not collect sensitive information like your location, contacts, or
                payment details.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">4. Data Retention & Deletion</h3>
            <p>
              We retain only the data required to operate Unplayed. You may request
              permanent deletion of your synced Steam data by emailing us at
              support@unplayed.wtf.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">5. Children's Privacy</h3>
            <p>
              Unplayed is not intended for users under 13 years old. If we become aware
              that we have collected personal information from a child under 13, we will
              delete it immediately.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-2">6. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. Any material changes
              will be posted to our site. Continued use of Unplayed after updates
              constitutes acceptance of those changes.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-800">
            <p className="text-gray-400 text-xs italic">
              Note: unplayed uses Valve's Steam Web API in accordance with their Terms
              of Use. We respect Steam's privacy rules and operate well below their API
              rate limits.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(PrivacyPolicyDialog);
