"use client";

import { Trash2 } from "lucide-react";
import { Event } from "./types";

interface WaitlistSectionProps {
  event: Event;
  isAdmin: boolean;
  isProcessing: boolean;
  onMoveFromWaitlist: (userId: string) => void;
  onRemoveFromWaitlist: (userId: string) => void;
}

export const WaitlistSection = ({
  event,
  isAdmin,
  isProcessing,
  onMoveFromWaitlist,
  onRemoveFromWaitlist,
}: WaitlistSectionProps) => {
  if (!event.waitlist || event.waitlist.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-bold text-black mb-4">
        Waitlist ({event.waitlist.length})
      </h2>
      <div className="space-y-2">
        {event.waitlist.map((player: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-4 py-3 px-4 bg-amber-50 border border-amber-200 rounded-md"
          >
            <span className="text-amber-600 font-medium w-6">{index + 1}</span>
            <span className="text-black flex-1">
              {player.firstName} {player.lastName?.charAt(0) || ""}
            </span>
            <span className="text-amber-600 text-sm">Waitlisted</span>
            {isAdmin && (
              <>
                <button
                  onClick={() =>
                    onMoveFromWaitlist(player._id || player.id)
                  }
                  disabled={isProcessing || event.seatsAvailable === 0}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                  title={
                    event.seatsAvailable === 0
                      ? "Event is full"
                      : "Add to event"
                  }
                >
                  Add to Event
                </button>
                <button
                  onClick={() =>
                    onRemoveFromWaitlist(player._id || player.id)
                  }
                  disabled={isProcessing}
                  className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                  title="Remove from waitlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
