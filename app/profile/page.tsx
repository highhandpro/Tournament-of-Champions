"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, Mail, Phone, Calendar, FileText, Edit, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

const Profile = () => {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    notes: ''
  });
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch current user data from server (like admin panel does)
  const fetchCurrentUser = async () => {
    try {
      const response = await api.getCurrentUser();
      setCurrentUser(response.user);
      
      // Update edited data with fresh data from server
      setEditedData({
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        phoneNumber: response.user.phoneNumber || '',
        notes: response.user.notes || ''
      });
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Initialize edited data when component mounts or user data changes
  useEffect(() => {
    if (session?.user && !hasInitialized) {
      // Use fresh data from server instead of session data
      fetchCurrentUser();
      setHasInitialized(true);
    }
  }, [session?.user]); // Remove hasInitialized from dependency array

  // Handle loading and error states after all hooks are defined
  if (status === 'loading') {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: "url('/assets/Faded-cards-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc2616] mx-auto mb-4"></div>
            <p className="text-black">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen" style={{
        backgroundImage: "url('/assets/Faded-cards-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-black text-xl mb-4">Please log in to view your profile</p>
            <button
              onClick={() => router.push('/login')}
              className="text-[#cc2616] hover:underline font-bold text-black"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f8f6ed' }}>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-black text-xl mb-4">Unable to load profile data</p>
          </div>
        </div>
      </div>
    );
  }

  const user = session.user;
  const firstName = currentUser?.firstName || (user as any).firstName || '';
  const lastName = currentUser?.lastName || (user as any).lastName || '';
  const phoneNumber = currentUser?.phoneNumber || (user as any).phoneNumber || 'Not provided';
  const notes = currentUser?.notes || (user as any).notes || '';
  const createdAt = currentUser?.createdAt || (user as any).createdAt || new Date().toISOString();

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber === 'Not provided' ? '' : phoneNumber,
      notes: notes
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Refresh data from server to ensure we have the latest
    fetchCurrentUser();
  };

  const handleSave = async () => {
    if (!editedData.firstName.trim() || !editedData.lastName.trim()) {
      showErrorToast('First name and last name are required');
      return;
    }

    if (editedData.phoneNumber && editedData.phoneNumber.replace(/\D/g, '').length !== 10) {
      showErrorToast('Phone number must be exactly 10 digits');
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.updateProfile({
        firstName: editedData.firstName.trim(),
        lastName: editedData.lastName.trim(),
        phoneNumber: editedData.phoneNumber.trim(),
        notes: editedData.notes.trim()
      });

      // Refresh user data from server (same approach as admin panel)
      await fetchCurrentUser();

      showSuccessToast('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showErrorToast('All password fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showErrorToast('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showErrorToast('New password and confirm password do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Use the proper change password API for regular users
      await api.changePassword(passwordData.currentPassword, passwordData.newPassword);

      showSuccessToast('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordSection(false);
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone === 'Not provided') return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen" style={{
        backgroundImage: "url('/assets/Faded-cards-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
      <Navbar />



      {/* Full width wrapper + centered card */}
      <div className="w-full px-4 sm:px-10 md:px-16 lg:px-24 py-8 flex justify-center">
        <div className="w-full max-w-[700px]">

          {/* Main Heading with Edit Button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide text-black">
              My Profile
            </h1>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-[#cc2616] text-white px-4 py-2 rounded-lg hover:bg-[#a51e12] transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-[#cc2616] text-white px-4 py-2 rounded-lg hover:bg-[#a51e12] transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <Card className="bg-white border-gray-300 shadow-xl w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4 overflow-hidden">

                {/* Avatar */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#cc2616]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#cc2616] text-xl sm:text-2xl font-display font-extrabold">
                    {firstName[0]}{lastName[0]}
                  </span>
                </div>

                {/* Name + Role */}
                <div className="min-w-0">
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-black tracking-wide truncate">
                    {firstName} {lastName}
                  </h2>
                  <p className="text-[#cc2616] text-xs sm:text-sm font-bold tracking-wider">
                    Club Member
                  </p>
                </div>

              </div>
            </CardHeader>

            <CardContent className="space-y-4">

              {/* Profile Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0 ${isEditing ? 'sm:col-span-2' : ''}`}>
                  <User className="w-5 h-5 text-[#cc2616] flex-shrink-0" />
                  <div className="min-w-0 overflow-hidden flex-1">
                    <p className="text-xs font-bold text-gray-600 tracking-wide">Full Name</p>
                    {isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          value={editedData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm font-display font-extrabold text-black"
                          placeholder="First Name"
                        />
                        <input
                          type="text"
                          value={editedData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm font-display font-extrabold text-black"
                          placeholder="Last Name"
                        />
                      </div>
                    ) : (
                      <p className="text-base sm:text-lg font-display font-extrabold text-black truncate">
                        {firstName} {lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                  <Mail className="w-5 h-5 text-[#cc2616] flex-shrink-0" />
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs font-bold text-gray-600 tracking-wide">Email</p>
                    <p className="text-base sm:text-lg font-bold text-black tracking-wide truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                  <Phone className="w-5 h-5 text-[#cc2616] flex-shrink-0" />
                  <div className="min-w-0 overflow-hidden flex-1">
                    <p className="text-xs font-bold text-gray-600 tracking-wide">Phone</p>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-bold text-black tracking-wide mt-1"
                        placeholder="(555) 123-4567"
                      />
                    ) : (
                      <p className="text-base sm:text-lg font-bold text-black tracking-wide truncate">
                        {formatPhoneNumber(currentUser?.phoneNumber || phoneNumber)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Member Since */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0">
                  <Calendar className="w-5 h-5 text-[#cc2616] flex-shrink-0" />
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs font-bold text-gray-600 tracking-wide">Member Since</p>
                    <p className="text-base sm:text-lg font-bold text-black tracking-wide truncate">
                      {format(new Date(createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

              </div>

              {/* Notes */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg overflow-hidden min-w-0">
                <FileText className="w-5 h-5 text-[#cc2616] mt-1 flex-shrink-0" />
                <div className="min-w-0 overflow-hidden flex-1">
                  <p className="text-xs font-bold text-gray-600 tracking-wide mb-1">Notes</p>
                  {isEditing ? (
                    <textarea
                      value={editedData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-black tracking-wide mt-1 min-h-[60px]"
                      placeholder="Any additional notes..."
                    />
                  ) : (
                    <p className="text-base sm:text-lg font-semibold text-black tracking-wide truncate">
                      {notes || 'No notes provided'}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Change Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                {!showPasswordSection ? (
                  <button
                    onClick={() => setShowPasswordSection(true)}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Change Password
                  </button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-black">Change Password</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">Current Password</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                          placeholder="Enter current password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">New Password</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowPasswordSection(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="flex items-center gap-2 bg-[#cc2616] text-white px-4 py-2 rounded-lg hover:bg-[#a51e12] transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {isChangingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
     
    </div>
  );
};

export default Profile;
