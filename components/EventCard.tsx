import Link from "next/link";
import { useState } from "react";

interface Player {
  firstName: string;
  lastInitial: string;
}

interface EventCardProps {
  id: string;
  title: string;
  isAdmin: boolean;
  date: string;
  time: string;
  seatsAvailable: number;
  registeredPlayers: Player[];
  waitlist: Player[];
  isUpcoming?: boolean;
  announcementDate?: string;
  userStatus?: "registered" | "waitlisted" | null;
  bgColor?: string;
  onUnregister?: () => Promise<void>;
  onLeaveWaitlist?: () => Promise<void>;
}

export function EventCard({
  id,
  title,
  isAdmin,
  date,
  time,
  seatsAvailable,
  registeredPlayers,
  waitlist,
  isUpcoming,
  announcementDate,
  userStatus,
  bgColor,
  onUnregister,
  onLeaveWaitlist,
}: EventCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUnregister = async () => {
    if (!onUnregister || isProcessing) return;
    setIsProcessing(true);
    try {
      await onUnregister();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!onLeaveWaitlist || isProcessing) return;
    setIsProcessing(true);
    try {
      await onLeaveWaitlist();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={`border p-5 flex flex-col gap-4 md:gap-2 md:flex-row justify-between w-full max-w-[700px] rounded-xl overflow-hidden border-[#aeaeae] ${
        isUpcoming ? "opacity-75" : ""
      }`}
      style={{ backgroundColor: bgColor || "#ebeaef" }}
    >
      <div className="flex flex-col md:w-[60%]">
        <div className="space-y-3 text-black">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[22px] font-bold text-[#10732e]">
              {title}
            </h3>
            {userStatus === "registered" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white border" style={{ backgroundColor: '#166534', borderColor: '#14532D' }}>
                ✓ Registered
              </span>
            )}
            {userStatus === "waitlisted" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                ⏳ Waitlisted
              </span>
            )}
          </div>
          {isUpcoming && announcementDate && (
            <p className="text-sm font-semibold text-amber-800">
              Announcement Date: {announcementDate}
            </p>
          )}
          <p className="text-base font-medium">
            {registeredPlayers.length} Registered - {seatsAvailable} seats
            available - {waitlist?.length || 0} Waitlist
          </p>
          <div className="space-y-0.5 text-base">
            <p>{date} {time}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-3">
          <Link
            href={`/events/${id}`}
            className="text-base font-medium text-[#c11e56] hover:underline"
          >
            See Details & Sign Up
          </Link>
          {isAdmin && (
            <Link
              href={`/admin/edit-event/${id}`}
              className="text-base font-medium text-[#c11e56] hover:underline"
            >
              Edit Event
            </Link>
          )}
          {userStatus === "registered" && onUnregister && (
            <p className="text-sm mt-1 text-gray-500">
              You&apos;re registered for this event. No longer available?{" "}
              <button
                onClick={handleUnregister}
                disabled={isProcessing}
                className="underline text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Cancelling..." : "Cancel Registration"}
              </button>
            </p>
          )}
          {userStatus === "waitlisted" && onLeaveWaitlist && (
            <button
              onClick={handleLeaveWaitlist}
              disabled={isProcessing}
              className="text-base font-medium text-[#c11e56] hover:underline text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Leaving waitlist..." : "Leave Waitlist"}
            </button>
          )}
        </div>
      </div>

      {/* Player list panel */}
      <div className="flex flex-col px-4 py-2 rounded-md md:w-[40%] w-full bg-white text-black">
        <p className="text-base font-medium text-gray-800">
          Registered list
        </p>
        {registeredPlayers.length > 0 ? (
          registeredPlayers.map((player, index) => (
            <div key={index} className="ml-2 text-sm">
              <span className="font-medium text-gray-600">
                {index + 1}. {player.firstName}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No registered players
          </p>
        )}
        {waitlist && waitlist.length > 0 && (
          <>
            <p className="text-base font-medium mt-2 text-gray-800">
              Waitlist
            </p>
            {waitlist.map((player, index) => (
              <div key={index} className="ml-2 text-sm">
                <span className="font-medium text-gray-600">
                  {index + 1}. {player.firstName}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
