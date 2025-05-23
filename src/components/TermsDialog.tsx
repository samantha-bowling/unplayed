
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsDialog = ({ open, onOpenChange }: TermsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>By using our service, you agree to these terms and conditions.</p>
          <p>For the full terms of service, please visit our website or contact us directly.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
