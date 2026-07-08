type EventData = {
  title?: string;
  dateTime?: string;
  location?: string;
  buyInMin?: number;
  buyInMax?: number;
  hospitalityFee?: number;
  maxPlayers?: number;
  eventType?: string;
  blinds?: string;
  details?: string;
  host?: string;
  announcementTier1At?: string;
  announcementTier2At?: string;
  announcementPostAt?: string;
  reminderAt?: string;
};

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `/api${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }

  // Auth endpoints
  async signup(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    notes?: string;
    password: string;
  }) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string, confirmPassword: string) {
    const result = await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirmPassword }),
    });
        return result;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // User endpoints
  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    notes?: string;
  }) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Event endpoints
  async getEvents(status?: string, limit?: number, section?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (section) params.append('section', section);

    return this.request(`/events?${params.toString()}`);
  }

  async getEvent(id: string) {
    return this.request(`/events/${id}`);
  }

  async registerForEvent(eventId: string) {
    return this.request(`/events/${eventId}/register`, {
      method: 'POST',
    });
  }

  async unregisterFromEvent(eventId: string) {
    return this.request(`/events/${eventId}/register`, {
      method: 'DELETE',
    });
  }

  async getWaitlist(eventId: string) {
    return this.request(`/events/${eventId}/waitlist`);
  }

  async joinWaitlist(eventId: string) {
    return this.request(`/events/${eventId}/waitlist`, {
      method: 'POST',
    });
  }

  async leaveWaitlist(eventId: string) {
    return this.request(`/events/${eventId}/waitlist`, {
      method: 'DELETE',
    });
  }

  async sendInvitation(eventId: string, playerId: string) {
    return this.request(`/admin/events/${eventId}/invite/${playerId}`, {
      method: 'POST',
    });
  }

  async removeInvitation(eventId: string, playerId: string) {
    return this.request(`/admin/events/${eventId}/invite/${playerId}`, {
      method: "DELETE",
    });
  }

  async acceptInvitation(eventId: string, token: string) {
    return this.request(`/events/${eventId}/invitation/accept?token=${token}`, {
      method: 'POST',
    });
  }
  
  async declineInvitation(eventId: string, token: string) {
    return this.request(`/events/${eventId}/invitation/decline?token=${token}`, {
      method: 'POST',
    });
  }

  // Admin endpoints
  async createEvent(eventData: {
    title: string;
    dateTime: string;
    location: string;
    buyInMin?: number;
    buyInMax?: number;
    hospitalityFee?: number;
    maxPlayers: number;
    eventType: string;
    blinds?: string;
    details?: string;
    host?: string;
    announcementTier1At?: string;
    announcementTier2At?: string;
    announcementPostAt?: string;
    reminderAt?: string;
  }) {
    return this.request('/admin/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id: string, eventData: EventData) {
    return this.request(`/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async archiveEvent(id: string) {
    return this.request(`/admin/events/${id}`, {
      method: 'DELETE',
    });
  }

  async getUsers() {
    return this.request('/admin/users');
  }

  async getUsersList() {
    return this.request('/users');
  }

  async updateTierHost(hostId: string, tier1: string[], tier2: string[]) {
    return this.request(`/host/${hostId}`, {
      method: 'PUT',
      body: JSON.stringify({ tier1, tier2 }),
    });
  }

  async updateHostAddress(hostId: string, address: string) {
    return this.request(`/host/${hostId}/address`, {
      method: 'PUT',
      body: JSON.stringify({ address }),
    });
  }

  async updateUserPhone(userId: string, phoneNumber: string, additionalData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    notes?: string;
    password?: string;
  }) {
    const requestData: Record<string, string> = { phoneNumber };
    
    // Add additional fields if provided
    if (additionalData) {
      if (additionalData.firstName !== undefined) requestData.firstName = additionalData.firstName;
      if (additionalData.lastName !== undefined) requestData.lastName = additionalData.lastName;
      if (additionalData.email !== undefined) requestData.email = additionalData.email;
      if (additionalData.role !== undefined) requestData.role = additionalData.role;
      if (additionalData.notes !== undefined) requestData.notes = additionalData.notes;
      if (additionalData.password !== undefined) requestData.password = additionalData.password;
    }
    
    return this.request(`/admin/users/${userId}/phone`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
  }

  async approveUser(userId: string) {
    return this.request(`/admin/users/${userId}/approve`, {
      method: 'POST',
    });
  }

  async denyUser(userId: string) {
    return this.request(`/admin/users/${userId}/deny`, {
      method: 'POST',
    });
  }

  async sendEventReminders() {
    return this.request('/admin/send-event-reminders', {
      method: 'POST',
    });
  }

  async exportMembersCSV() {
    return this.request('/admin/users/export/csv', {
      method: 'GET',
    });
  }

  async exportMembersPDF() {
    return this.request('/admin/users/export/pdf', {
      method: 'GET',
    });
  }

  async sendEventAnnouncement(eventId: string) {
    return this.request(`/admin/events/${eventId}/announce`, {
      method: 'POST',
    });
  }

  async sendOpenSeatNotification(eventId: string) {
    return this.request(`/admin/events/${eventId}/open-seat`, {
      method: 'POST',
    });
  }

  async addPlayerToEvent(eventId: string, playerId: string) {
    return this.request(`/admin/events/${eventId}/players/${playerId}`, {
      method: 'POST',
    });
  }

  async removePlayerFromEvent(eventId: string, playerId: string) {
    return this.request(`/admin/events/${eventId}/players/${playerId}`, {
      method: 'DELETE',
    });
  }

  async moveFromWaitlistToRegistered(eventId: string, userId: string) {
    return this.request(`/admin/events/${eventId}/waitlist/${userId}`, {
      method: 'POST',
    });
  }

  async removePlayerFromWaitlist(eventId: string, userId: string) {
    return this.request(`/admin/events/${eventId}/waitlist/${userId}`, {
      method: 'DELETE',
    });
  }

  async hardDeleteEvent(eventId: string) {
    return this.request(`/admin/events/${eventId}/hard-delete`, {
      method: 'DELETE',
    });
  }

  async hardDeleteUser(userId: string) {
    return this.request(`/admin/users/${userId}/hard-delete`, {
      method: 'DELETE',
    });
  }

  async duplicateEvent(eventId: string) {
    return this.request(`/admin/events/${eventId}/duplicate`, {
      method: 'POST',
    });
  }

  async restoreEvent(eventId: string) {
    return this.request(`/admin/events/${eventId}/restore`, {
      method: 'POST',
    });
  }
  
  async getAllHosts() {
    return this.request(`/host`, {
      method: 'GET',
    });
  }

  async getHost(userId: string) {
    return this.request(`/host/${userId}`, {
      method: 'GET',
    });
  }

  async getSubAdminArchivedEvents() {
    return this.request('/sub-admin/archived-events');
  }

  // Photo endpoints
  async uploadPhoto(file: File, caption?: string) {
    const formData = new FormData();
    formData.append('photo', file);
    if (caption) formData.append('caption', caption);

    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload photo');
    }
    return data;
  }

  async getApprovedPhotos() {
    return this.request('/photos');
  }

  async getAdminPhotos(status?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return this.request(`/admin/photos?${params.toString()}`);
  }

  async approvePhoto(id: string) {
    return this.request(`/admin/photos/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectPhoto(id: string) {
    return this.request(`/admin/photos/${id}/reject`, {
      method: 'POST',
    });
  }

  async deleteEmailLog(id: string) {
    return this.request(`/admin/email-logs/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadEventBanner(eventId: string, file: File) {
    const formData = new FormData();
    formData.append('banner', file);
    const response = await fetch(`/api/admin/events/${eventId}/banner`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to upload banner');
    return data as { bannerImageUrl: string; bannerImagePublicId: string };
  }

  async deleteEventBanner(eventId: string) {
    return this.request(`/admin/events/${eventId}/banner`, { method: 'DELETE' });
  }

  async deletePhoto(id: string) {
    return this.request(`/admin/photos/${id}`, {
      method: 'DELETE',
    });
  }

  async updatePhotoCaption(id: string, caption: string) {
    return this.request(`/admin/photos/${id}/caption`, {
      method: 'PUT',
      body: JSON.stringify({ caption }),
    });
  }
  
  async updateHost(userId: string, data: Record<string, unknown>) {
    return this.request(`/host/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getEmailLogs() {
    return this.request('/admin/email-logs');
  }

  async runCronManually() {
    return this.request('/cron/run-scheduled-event-emails', { method: 'POST' });
  }

  async getDismissals() {
    return this.request('/admin/dismissals');
  }

  async updateDismissals(data: { seenEventIds?: string[]; dismissedDays?: string[] }) {
    return this.request('/admin/dismissals', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getRegistrationLogs(params?: {
    eventId?: string;
    userId?: string;
    action?: string;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.eventId) searchParams.append('eventId', params.eventId);
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.action) searchParams.append('action', params.action);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const query = searchParams.toString();
    return this.request(`/admin/registration-logs${query ? `?${query}` : ''}`);
  }
}

export const api = new ApiClient();
