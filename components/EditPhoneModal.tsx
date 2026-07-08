"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import { useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";

interface EditPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentPhone: string;
  currentFirstName?: string;
  currentLastName?: string;
  currentEmail?: string;
  currentRole?: 'ADMIN' | 'MEMBER' | 'SUB_ADMIN';
  currentNotes?: string;
  onUpdate: () => void;
}

export function EditPhoneModal({ 
  isOpen, 
  onClose, 
  userId, 
  currentPhone, 
  currentFirstName = '',
  currentLastName = '',
  currentEmail = '',
  currentRole = 'MEMBER',
  currentNotes = '',
  onUpdate 
}: EditPhoneModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(currentPhone);
  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);
  const [email, setEmail] = useState(currentEmail);
  const [role, setRole] = useState(currentRole);
  const [notes, setNotes] = useState(currentNotes);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPhoneNumber(currentPhone);
    setFirstName(currentFirstName);
    setLastName(currentLastName);
    setEmail(currentEmail);
    setRole(currentRole)
    setNotes(currentNotes);
    setPassword(''); 
  }, [currentPhone, currentFirstName, currentLastName, currentEmail, currentRole, currentNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      showErrorToast('Phone number is required');
      return;
    }

    // Validate phone number (10 digits)
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      showErrorToast('Phone number must be exactly 10 digits');
      return;
    }

    // Validate first name
    if (!firstName.trim()) {
      showErrorToast('First name is required');
      return;
    }
    if (firstName.length > 50) {
      showErrorToast('First name cannot exceed 50 characters');
      return;
    }

    // Validate last name
    if (!lastName.trim()) {
      showErrorToast('Last name is required');
      return;
    }
    if (lastName.length > 50) {
      showErrorToast('Last name cannot exceed 50 characters');
      return;
    }

    // Validate email
    if (!email.trim()) {
      showErrorToast('Email is required');
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    // Validate password if provided
    if (password && password.length < 6) {
      showErrorToast('Password must be at least 6 characters long');
      return;
    }

    // Validate notes
    if (notes.length > 500) {
      showErrorToast('Notes cannot exceed 500 characters');
      return;
    }

    setIsLoading(true);
    const loadingToast = showLoadingToast('Updating user details...');

    try {
      const additionalData: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        notes: notes.trim(),
        role: role
      };

      // Only include password if it's provided
      if (password) {
        additionalData.password = password;
      }

      await api.updateUserPhone(userId, phoneNumber, additionalData);
      showSuccessToast('User details updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to update user details');
    } finally {
      setIsLoading(false);
      dismissToast(loadingToast);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" style={{ backgroundColor: '#f8f6ed' }}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-black">Edit User Details</DialogTitle>
            <DialogDescription className="text-black">
              Update the user's information. All fields except password are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right text-black">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="col-span-3 text-black"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right text-black">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="col-span-3 text-black"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-black">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3 text-black"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right text-black">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="3608692538 "
                className="col-span-3 text-black"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right text-black">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="col-span-3 text-black"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-gray-700 text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about the user"
                className="col-span-3 text-md rounded-xl bg-gray-50 resize-none truncate text-black"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="checkbox-admin" className="text-right text-black">
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  id="checkbox-admin"
                  type="checkbox"
                  checked={role === 'ADMIN'}
                  onChange={(e) => setRole(e.target.checked ? 'ADMIN' : 'MEMBER')}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="checkbox-admin" className="ml-2 text-sm text-gray-700">
                  Make this user an administrator
                </label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="checkbox-subadmin" className="text-right text-black">
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  id="checkbox-subadmin"
                  type="checkbox"
                  checked={role === 'SUB_ADMIN'}
                  onChange={(e) => setRole(e.target.checked ? 'SUB_ADMIN' : 'MEMBER')}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="checkbox-subadmin" className="ml-2 text-sm text-gray-700">
                  Make this user a sub-administrator
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button style={{ backgroundColor: '#f8f6ed' }} className="bg-white text-black" type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="text-white bg-[#cc2616] hover:bg-[#cc2616]/90">
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}