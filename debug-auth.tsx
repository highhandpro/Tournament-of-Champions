'use client';

import { useAuth } from '@/contexts/AuthContext';

export function DebugAuth() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="fixed top-4 right-4 bg-yellow-100 p-2 rounded">Loading auth...</div>;
  }

  return (
    <div className="fixed top-4 right-4 bg-blue-100 p-2 rounded text-xs">
      <div>User: {user?.email || 'None'}</div>
      <div>Admin: {isAdmin ? 'Yes' : 'No'}</div>
    </div>
  );
}