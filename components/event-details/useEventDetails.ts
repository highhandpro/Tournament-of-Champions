"use client";

import { api } from "@/lib/api";
import {
  dismissToast,
  showErrorToast,
  showLoadingToast,
  showSuccessToast,
  toastMessages,
} from "@/lib/toast";
import { convertGoogleDriveUrl } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Event } from "./types";

export const useEventDetails = () => {
  const { id } = useParams();
  const { data: session } = useSession();
  const user = session?.user;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isInWaitlist, setIsInWaitlist] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [addPlayerModalType, setAddPlayerModalType] = useState<"ADD" | "INVITE">("ADD");
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: "", title: "" });
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id, user]);

  useEffect(() => {
    if (user) checkAdminStatus();
    else setIsAdmin(false);
  }, [user]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await api.getEvent(id as string);
      if (data.event.registeredPlayers)
        data.event.registeredPlayers.sort((a: any, b: any) =>
          a.firstName.localeCompare(b.firstName),
        );
      setEvent(data.event);

      if (data.event.registeredPlayers) {
        const userRegistered = data.event.registeredPlayers.some(
          (player: any) => {
            if (!user) return false;
            return player._id === (user as any).id || player.email === user.email;
          },
        );
        setIsRegistered(userRegistered);

        const userInWaitlist =
          data.event.waitlist &&
          data.event.waitlist.some((player: any) => {
            if (!user) return false;
            return player._id === (user as any).id || player.email === user.email;
          });
        setIsInWaitlist(userInWaitlist);
      }
    } catch (error) {
      showErrorToast("Failed to load event details. Please try again.");
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/auth/check-admin");
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const handleRegistration = async () => {
    if (!user) {
      showErrorToast("Please log in to register for events");
      return;
    }
    setIsProcessing(true);
    const loadingToast = showLoadingToast(
      isRegistered
        ? "Unregistering from event..."
        : isInWaitlist
          ? "Leaving waitlist..."
          : "Registering for event...",
    );
    try {
      if (isRegistered) {
        await api.unregisterFromEvent(id as string);
        setIsRegistered(false);
        showSuccessToast(toastMessages.events.unregistrationSuccess);
      } else if (isInWaitlist) {
        await api.leaveWaitlist(id as string);
        setIsInWaitlist(false);
        showSuccessToast("Successfully removed from waitlist");
      } else {
        try {
          await api.registerForEvent(id as string);
          setIsRegistered(true);
          showSuccessToast(toastMessages.events.registrationSuccess);
        } catch (error: any) {
          if (error.message.includes("full") || error.message.includes("Event is full")) {
            await api.joinWaitlist(id as string);
            setIsInWaitlist(true);
            showSuccessToast("Successfully added to waitlist");
          } else {
            throw error;
          }
        }
      }
      await fetchEvent();
    } catch (error: any) {
      showErrorToast(error.message || toastMessages.general.error);
    } finally {
      setIsProcessing(false);
      dismissToast(loadingToast);
    }
  };

  const handleReplaceBanner = async (file: File) => {
    if (!event) return;
    setIsUploadingBanner(true);
    try {
      await api.uploadEventBanner(event._id, file);
      await fetchEvent();
      showSuccessToast("Banner updated!");
    } catch (err: any) {
      showErrorToast(err.message || "Failed to update banner");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleAddPlayer = async (playerId: string) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    const loadingToast = showLoadingToast("Adding player to event...");
    try {
      const result = await api.addPlayerToEvent(id as string, playerId);
      showSuccessToast(result.message);
      setShowAddPlayerModal(false);
      await fetchEvent();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to add player to event");
    } finally {
      setIsProcessing(false);
      dismissToast(loadingToast);
    }
  };

  const handleSendInvitation = async (playerId: string) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    const loadingToast = showLoadingToast("Sending invitation...");
    try {
      await api.sendInvitation(id as string, playerId);
      showSuccessToast("Invitation sent successfully");
      setShowAddPlayerModal(false);
      await fetchEvent();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to send invitation");
    } finally {
      setIsProcessing(false);
      dismissToast(loadingToast);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    const loadingToast = showLoadingToast("Removing player from event...");
    try {
      await api.removePlayerFromEvent(id as string, playerId);
      showSuccessToast("Player removed from event successfully");
      await fetchEvent();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to remove player from event");
    } finally {
      setIsProcessing(false);
      dismissToast(loadingToast);
    }
  };

  const handleRemoveInvitation = async (playerId: string) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    const loadingToast = showLoadingToast("Removing invitation...");
    try {
      await api.removeInvitation(id as string, playerId);
      showSuccessToast("Invitation removed successfully");
      await fetchEvent();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to remove invitation");
    } finally {
      setIsProcessing(false);
      dismissToast(loadingToast);
    }
  };

  const handleMoveFromWaitlist = async (userId: string) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    const loadingToast = showLoadingToast("Moving player from waitlist to event...");
    try {
      await api.moveFromWaitlistToRegistered(id as string, userId);
      showSuccessToast("Player successfully added to event from waitlist");
      await fetchEvent();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to move player from waitlist to event");
    } finally {
      setIsProcessing(false);
      dismissToast(loadingToast);
    }
  };

  const handleRemoveFromWaitlist = async (userId: string) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    const loadingToast = showLoadingToast("Remove player from waitlist...");
    try {
      await api.removePlayerFromWaitlist(id as string, userId);
      showSuccessToast("Player successfully removed from waitlist");
      await fetchEvent();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to remove player from waitlist");
    } finally {
      setIsProcessing(false);
      dismissToast(loadingToast);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await api.getUsers();
      const users = Array.isArray(response) ? response : response.users || [];
      const registeredPlayerIds = event?.registeredPlayers.map((p: any) => p._id || p.id) || [];
      const invitedPlayerIds = event?.invitedPlayers.map((p: any) => p._id || p.id) || [];
      const waitlistPlayerIds = event?.waitlist.map((p: any) => p._id || p.id) || [];
      const excludedIds = [...registeredPlayerIds, ...invitedPlayerIds, ...waitlistPlayerIds];
      const available = users
        .filter((user: any) => !excludedIds.includes(user._id || user.id))
        .sort((a: any, b: any) => a.firstName.localeCompare(b.firstName));
      setAvailableUsers(available);
    } catch (error) {
      console.error("Error loading users:", error);
      showErrorToast("Failed to load available users");
    }
  };

  const handleImageClick = (url: string, label: string) => {
    const imageUrl = convertGoogleDriveUrl(url);
    setSelectedImage({ url: imageUrl, title: label });
    setImageModalOpen(true);
  };

  return {
    id,
    user,
    event,
    loading,
    isRegistered,
    isInWaitlist,
    isProcessing,
    isAdmin,
    addPlayerModalType,
    showAddPlayerModal,
    availableUsers,
    imageModalOpen,
    selectedImage,
    isUploadingBanner,
    setAddPlayerModalType,
    setShowAddPlayerModal,
    setImageModalOpen,
    handleRegistration,
    handleReplaceBanner,
    handleAddPlayer,
    handleSendInvitation,
    handleRemovePlayer,
    handleRemoveInvitation,
    handleMoveFromWaitlist,
    handleRemoveFromWaitlist,
    loadAvailableUsers,
    handleImageClick,
  };
};
