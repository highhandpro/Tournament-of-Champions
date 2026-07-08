"use client";

import {
  AddPlayerModal,
  EventDetailsGrid,
  HeroSection,
  RegisteredPlayersSection,
  useEventDetails,
  WaitlistSection,
} from "@/components/event-details";
import { EventRulesModal } from "@/components/EventRulesModal";
import { ImageModal } from "@/components/ImageModal";
import { Navbar } from "@/components/Navbar";
import { formatDateInPST, formatTimeInPST } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const EventDetailsStyled = () => {
  const {
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
  } = useEventDetails();

  const [openRuleModal, setOpenRuleModal] = useState(false);

  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundImage: "url('/assets/Faded-cards-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
              <p className="text-black">Loading event details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundImage: "url('/assets/Faded-cards-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Event Not Found</h1>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.dateTime);
  const isEventFull = event.seatsAvailable === 0;
  const isEventPast = eventDate < new Date(Date.now() - 90 * 60 * 1000);
  const isUpcoming = event.announcementTier1At
    ? new Date(event.announcementTier1At) > new Date()
    : false;

  const getButtonText = () => {
    if (isProcessing) {
      if (isRegistered) return "Unregistering...";
      if (isInWaitlist) return "Leaving waitlist...";
      return isEventFull ? "Joining waitlist..." : "Registering...";
    }
    if (isRegistered) return "Unregister";
    if (isInWaitlist) return "Leave Waitlist";
    if (isUpcoming) return "Not Yet Announced";
    return isEventFull ? "Join Waitlist" : "Register";
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/assets/Faded-cards-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Navbar />
      <EventRulesModal isOpen={openRuleModal} onClose={() => setOpenRuleModal(false)} />
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={selectedImage.url}
        title={selectedImage.title}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <HeroSection
          event={event}
          eventId={id as string}
          formattedDate={formatDateInPST(eventDate)}
          isAdmin={isAdmin}
          isRegistered={isRegistered}
          isInWaitlist={isInWaitlist}
          isProcessing={isProcessing}
          isEventPast={isEventPast}
          isEventFull={isEventFull}
          isUpcoming={isUpcoming}
          isUploadingBanner={isUploadingBanner}
          user={user}
          onRegistration={handleRegistration}
          onReplaceBanner={handleReplaceBanner}
          getButtonText={getButtonText}
        />

        <EventDetailsGrid
          event={event}
          formattedDate={formatDateInPST(eventDate)}
          formattedTime={formatTimeInPST(eventDate)}
          onImageClick={handleImageClick}
        />

        <RegisteredPlayersSection
          event={event}
          isAdmin={isAdmin}
          isProcessing={isProcessing}
          onAddPlayer={() => {
            loadAvailableUsers();
            setAddPlayerModalType("ADD");
            setShowAddPlayerModal(true);
          }}
          onInvitePlayer={() => {
            loadAvailableUsers();
            setAddPlayerModalType("INVITE");
            setShowAddPlayerModal(true);
          }}
          onRemovePlayer={handleRemovePlayer}
          onRemoveInvitation={handleRemoveInvitation}
        />

        <WaitlistSection
          event={event}
          isAdmin={isAdmin}
          isProcessing={isProcessing}
          onMoveFromWaitlist={handleMoveFromWaitlist}
          onRemoveFromWaitlist={handleRemoveFromWaitlist}
        />

        {showAddPlayerModal && (
          <AddPlayerModal
            modalType={addPlayerModalType}
            availableUsers={availableUsers}
            isProcessing={isProcessing}
            onAddPlayer={handleAddPlayer}
            onSendInvitation={handleSendInvitation}
            onClose={() => setShowAddPlayerModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default EventDetailsStyled;
