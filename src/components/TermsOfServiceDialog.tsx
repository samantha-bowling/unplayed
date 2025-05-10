
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TermsOfServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsOfServiceDialog = ({ open, onOpenChange }: TermsOfServiceDialogProps) => {
  console.log("TermsOfServiceDialog render: open =", open);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="text-unplayed-mint">✅ Terms of Service</span>
            <span className="text-unplayed-pink">– Unplayed.wtf</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Effective Date: May 8, 2025 | Last Updated: May 10, 2025
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-sm text-gray-300 space-y-4 mt-4">
          <p>
            Welcome to Unplayed.wtf! By accessing or using our platform, you agree to the following Terms of Service ("Terms").
          </p>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">1. Eligibility</h3>
            <p>
              You must be 13 years or older and have a valid Steam account to use Unplayed.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">2. Account & Login</h3>
            <p className="mb-1">
              Unplayed uses Steam OpenID for authentication. You are responsible for any activity that occurs under your Steam-linked session.
            </p>
            <p>
              We never collect or store your Steam password. All authentication is handled securely via Steam's OpenID system.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">3. Use of the Service</h3>
            <p className="mb-2">
              You agree to use Unplayed only for lawful purposes. You may not:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Attempt to reverse-engineer or disrupt the platform.</li>
              <li>Use bots or scripts to scrape or exploit the service.</li>
              <li>Resell or commercialize any part of the platform or its data.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">4. Intellectual Property</h3>
            <p>
              All content and code on Unplayed.wtf is the property of Unplayed, unless otherwise stated. You may not reuse or republish our platform's source materials without permission.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">5. Steam API Usage</h3>
            <p className="mb-1">
              Unplayed uses Valve's Steam Web API in accordance with its Terms of Use. We are not affiliated with or endorsed by Valve Corporation.
            </p>
            <p>
              We only access Steam Data with your explicit permission and do not store or display private profile data unless you have made your Steam profile public.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">6. Disclaimers</h3>
            <p className="mb-1">
              Unplayed is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service or data accuracy.
            </p>
            <p>
              Steam Data is provided by Valve Corporation and may be incomplete, delayed, or unavailable at times due to API limitations or user privacy settings.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">7. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, Unplayed shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the service.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">8. Termination</h3>
            <p className="mb-1">
              We reserve the right to suspend or terminate your access to Unplayed for any reason, especially in case of misuse or violation of these Terms.
            </p>
            <p>
              If you violate the Steam Subscriber Agreement or Steam Web API Terms, your access to Unplayed may also be revoked.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-2">9. Governing Law</h3>
            <p>
              These Terms are governed by the laws of the State of Washington, USA.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfServiceDialog;
