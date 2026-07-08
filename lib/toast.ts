import toast from 'react-hot-toast';

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'bottom-left',
    style: {
      background: '#10b981',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981',
    },
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'bottom-left',
    style: {
      background: '#ef4444',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  });
};

export const showInfoToast = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'bottom-left',
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
    },
  });
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    position: 'bottom-left',
  });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Common toast messages
export const toastMessages = {
  auth: {
    signupSuccess: 'Welcome to the poker club! Your account has been created.',
    loginSuccess: 'Welcome back! You have been logged in successfully.',
    logoutSuccess: 'You have been logged out successfully.',
    sessionExpired: 'Your session has expired. Please log in again.',
  },
  events: {
    registrationSuccess: 'You have been registered for the event successfully!',
    unregistrationSuccess: 'You have been unregistered from the event successfully.',
    eventFull: 'Sorry, this event is already full.',
    alreadyRegistered: 'You are already registered for this event.',
    notRegistered: 'You are not registered for this event.',
    eventStarted: 'Cannot register for events that have already started.',
    eventArchived: 'Cannot register for archived events.',
  },
  profile: {
    updateSuccess: 'Your profile has been updated successfully.',
    phoneUpdateSuccess: 'Phone number updated successfully.',
  },
  admin: {
    eventCreated: 'Event created successfully!',
    eventUpdated: 'Event updated successfully!',
    eventArchived: 'Event archived successfully!',
    playerRemoved: 'Player removed from event successfully.',
    unauthorized: 'You do not have permission to perform this action.',
  },
  general: {
    error: 'Something went wrong. Please try again.',
    networkError: 'Network error. Please check your connection and try again.',
    validationError: 'Please check your input and try again.',
  },
};