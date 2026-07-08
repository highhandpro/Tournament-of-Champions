"use client";

import { Plus, Trash2 } from "lucide-react";
import { Event } from "./types";

interface RegisteredPlayersSectionProps {
  event: Event;
  isAdmin: boolean;
  isProcessing: boolean;
  onAddPlayer: () => void;
  onInvitePlayer: () => void;
  onRemovePlayer: (playerId: string) => void;
  onRemoveInvitation: (playerId: string) => void;
}

export const RegisteredPlayersSection = ({
  event,
  isAdmin,
  isProcessing,
  onAddPlayer,
  onInvitePlayer,
  onRemovePlayer,
  onRemoveInvitation,
}: RegisteredPlayersSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="grid grid-cols-1">
        {/* Registered Players */}
        <div className="p-6">
          <div className="flex flex-row items-center justify-between mb-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-black">
                Currently Registered
              </h2>
              <p
                style={{ backgroundColor: "#f8f6ed" }}
                className="text-black text-sm"
              >
                {event.registeredPlayers.length} Registered -{" "}
                {event.seatsAvailable} seats available
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={onAddPlayer}
                disabled={isProcessing}
                className="bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
                Add Player
              </button>
            )}
          </div>
          {event.registeredPlayers.length > 0 ? (
            <div className="space-y-2">
              {event.registeredPlayers.map((player: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-md"
                >
                  <span className="text-gray-600 font-medium w-4">
                    {index + 1}
                  </span>
                  <span className="text-black flex-1">
                    {player.firstName} {player.lastName?.charAt(0) || ""}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => onRemovePlayer(player._id || player.id)}
                      disabled={isProcessing}
                      className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                      title="Remove player from event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No players registered yet</p>
          )}
        </div>

        {/* Invitations */}
        <div className="p-6">
          <div className="flex flex-row items-center justify-between mb-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-black">Invitations</h2>
            </div>
            <button
              onClick={onInvitePlayer}
              disabled={isProcessing}
              className="bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Invite
            </button>
          </div>
          {event.invitedPlayers.length > 0 ? (
            <div className="space-y-2">
              {event.invitedPlayers.map((player: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-md"
                >
                  <span className="text-gray-600 font-medium w-4">
                    {index + 1}
                  </span>
                  <span className="text-black flex-1">
                    {player.firstName} {player.lastName?.charAt(0) || ""}
                  </span>
                  <button
                    onClick={() =>
                      onRemoveInvitation(player._id || player.id)
                    }
                    disabled={isProcessing}
                    className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                    title="Remove invitation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No players registered yet</p>
          )}
        </div>
      </div>
    </div>
  );
};
