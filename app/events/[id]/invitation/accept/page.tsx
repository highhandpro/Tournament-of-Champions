"use client";

import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AcceptInvitationPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const acceptInvitation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid invitation link');
        return;
      }

      try {
        const result = await api.acceptInvitation(id as string, token);
        setStatus('success');
        setMessage(result.message);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to accept invitation');
      }
    };

    acceptInvitation();
  }, [id, token]);

  return (
    <div className="min-h-screen" style={{
      backgroundImage: "url('/assets/Faded-cards-background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <Navbar />
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(80vh - 80px)' }}>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your invitation...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Registered!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              {/* <Link href={`/events/${id}`} className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition">
                View Event Details
              </Link> */}
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
              <p className="text-gray-600 mb-6">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}