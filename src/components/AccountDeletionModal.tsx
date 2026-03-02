
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AccountDeletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reasonOptions = [
  { value: "not_useful", label: "Not useful for me" },
  { value: "too_complex", label: "Too complex to use" },
  { value: "found_alternative", label: "Found a better alternative" },
  { value: "privacy_concerns", label: "Privacy concerns" },
  { value: "dont_use_enough", label: "Don't use it enough" },
  { value: "bugs", label: "Too many bugs or issues" },
  { value: "other", label: "Other reason" }
];

export function AccountDeletionModal({ open, onOpenChange }: AccountDeletionModalProps) {
  
  const { signOut } = useAuth();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  
  const handleDelete = async () => {
    if (!isConfirmed) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: {
          feedback,
          reason
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Show success message
      toast("Account deleted", {
        description: "Your account has been successfully deleted.",
      });
      
      // Sign out the user after successful deletion
      setTimeout(() => {
        signOut();
        window.location.href = "/";
      }, 1000);
      
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Error", {
        description: "Failed to delete your account. Please try again later.",
      });
      setIsDeleting(false);
    }
  };
  
  const resetState = () => {
    setIsConfirmed(false);
    setIsDeleting(false);
    setReason("");
    setFeedback("");
  };
  
  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-unplayed-red">
            <AlertTriangle className="h-5 w-5" />
            Delete Your Account
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            This action will permanently delete your account and all associated data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <Label htmlFor="reason">Why are you leaving? (Optional)</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea 
              id="feedback"
              placeholder="Please let us know how we could improve"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="h-24"
            />
          </div>
          
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox 
              id="confirm" 
              checked={isConfirmed} 
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              className="mt-1"
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none text-gray-300"
            >
              I understand that deleting my account will permanently remove all my data and this action cannot be undone.
            </label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="bg-unplayed-red hover:bg-unplayed-red/80 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AccountDeletionModal;
