
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyDialog = ({ open, onOpenChange }: PrivacyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your information.</p>
          <p>For the full privacy policy, please visit our website or contact us directly.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyDialog;
