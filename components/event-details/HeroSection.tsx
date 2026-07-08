"use client";

import { ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { Event } from "./types";

interface HeroSectionProps {
  event: Event;
  eventId: string;
  formattedDate: string;
  isAdmin: boolean;
  isRegistered: boolean;
  isInWaitlist: boolean;
  isProcessing: boolean;
  isEventPast: boolean;
  isEventFull: boolean;
  isUpcoming: boolean;
  isUploadingBanner: boolean;
  user: any;
  onRegistration: () => void;
  onReplaceBanner: (file: File) => void;
  getButtonText: () => string;
}

export const HeroSection = ({
  event,
  eventId,
  formattedDate,
  isAdmin,
  isRegistered,
  isInWaitlist,
  isProcessing,
  isEventPast,
  isEventFull,
  isUpcoming,
  isUploadingBanner,
  user,
  onRegistration,
  onReplaceBanner,
  getButtonText,
}: HeroSectionProps) => {
  const bannerInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="rounded-lg shadow-lg p-8 mb-6 text-white relative overflow-hidden"
      style={
        event.bannerImageUrl
          ? {
              backgroundImage: `url("${event.bannerImageUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { backgroundColor: "#14532d" }
      }
    >
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-white hover:text-white-50 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>
      <h1 className="text-4xl font-bold mb-3">{event.title}</h1>
      <p className="text-green-100 text-lg mb-6">{formattedDate}</p>
      <div className="flex items-center gap-3">
        <span className="text-green-100">
          {event.seatsAvailable} of {event.maxPlayers} seats available
        </span>
      </div>

      <div className="flex flex-wrap gap-4 items-center mt-6 w-full">
        <div>
          {!user ? (
            <Link href={`/login?callbackUrl=/events/${eventId}`}>
              <button className="bg-white text-green-900 px-8 py-2 rounded-md font-semibold hover:bg-green-50 transition-colors">
                Login to Register
              </button>
            </Link>
          ) : isEventPast ? (
            <button
              className="bg-white text-green-900 px-8 py-2 rounded-md font-semibold opacity-50 cursor-not-allowed"
              disabled
            >
              Event Has Ended
            </button>
          ) : isUpcoming ? (
            <button
              className="bg-white text-green-900 px-8 py-2 rounded-md font-semibold opacity-50 cursor-not-allowed"
              disabled
            >
              {getButtonText()}
            </button>
          ) : (
            <button
              onClick={onRegistration}
              disabled={isProcessing}
              className="bg-white text-green-900 px-8 py-2 rounded-md font-semibold hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getButtonText()}
            </button>
          )}
        </div>
        <div>
          <Link href={`/admin/edit-event/${event._id}`}>
            <button className="bg-white text-green-900 px-8 py-2 rounded-md font-semibold hover:bg-green-50 transition-colors">
              Edit
            </button>
          </Link>
        </div>
      </div>

      {/* Admin: replace banner */}
      {isAdmin && (
        <>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onReplaceBanner(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={isUploadingBanner}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors disabled:opacity-60"
            title="Replace banner image"
          >
            <Camera className="w-3.5 h-3.5" />
            {isUploadingBanner ? "Uploading..." : "Replace banner"}
          </button>
        </>
      )}
    </div>
  );
};
