"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteUserModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  onConfirm,
  isLoading = false,
}: DeleteUserModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent style={{ backgroundColor: '#f8f6ed' }}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">Delete User</AlertDialogTitle>
          <AlertDialogDescription className="text-red-600">
            Are you sure you want to permanently delete the user <strong>{userName}</strong> ({userEmail})? 
            This action cannot be undone. The user will be completely removed from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-red-600" onClick={onClose} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Deleting..." : "Delete Permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}