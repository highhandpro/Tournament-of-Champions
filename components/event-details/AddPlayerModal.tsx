"use client";

interface AddPlayerModalProps {
  modalType: "ADD" | "INVITE";
  availableUsers: any[];
  isProcessing: boolean;
  onAddPlayer: (playerId: string) => void;
  onSendInvitation: (playerId: string) => void;
  onClose: () => void;
}

export const AddPlayerModal = ({
  modalType,
  availableUsers,
  isProcessing,
  onAddPlayer,
  onSendInvitation,
  onClose,
}: AddPlayerModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-bold text-black mb-4">
          {modalType === "ADD"
            ? "Add Player to Event"
            : "Invite Player to Event"}
        </h3>
        <div className="max-h-[400px] overflow-y-auto">
          {availableUsers.length > 0 ? (
            <div className="space-y-2">
              {availableUsers.map((user: any) => (
                <div
                  key={user._id || user.id}
                  className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div>
                    <p className="text-black font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (modalType === "ADD")
                        onAddPlayer(user._id || user.id);
                      else onSendInvitation(user._id || user.id);
                    }}
                    disabled={isProcessing}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {modalType === "ADD" ? "Add" : "Send Invitation"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No available users to add
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors ring-1 ring-gray-200 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
