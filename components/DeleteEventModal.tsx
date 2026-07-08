"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteEventModal({ 
  isOpen, 
  onClose, 
  eventTitle, 
  onConfirm,
  isLoading = false
}: DeleteEventModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    onConfirm();
  };

  const handleClose = () => {
    if (!isLoading && !isConfirming) {
      onClose();
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" style={{ backgroundColor: '#f8f6ed' }}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <DialogTitle className="text-red-600 text-xl font-bold">
              Delete Archived Event
            </DialogTitle>
          </div>
          <DialogDescription className="text-black text-base">
            Are you sure you want to permanently delete the archived event "<span className="font-semibold">{eventTitle}</span>"?
            <br /><br />
            <span className="text-red-600 font-semibold">
              This action cannot be undone. The event will be permanently removed from the database.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading || isConfirming}
            className="bg-white text-black border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading || isConfirming}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading || isConfirming ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}