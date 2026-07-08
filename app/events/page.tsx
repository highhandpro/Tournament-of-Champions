"use client";
import { EventCard } from "@/components/EventCard";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatDateInPST, formatTimeInPST } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Event {
  _id: string;
  title: string;
  dateTime: string;
  location: string;
  buyInMin: number;
  buyInMax: number;
  maxPlayers: number;
  eventType: "cash" | "tournament";
  blinds?: string;
  status: "ACTIVE" | "ARCHIVED";
  registeredPlayers: any[];
  waitlist: any[];
  seatsAvailable: number;
  announcementTier1At?: string;
  cardBgColor?: string;
  host?: any;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const user = session?.user;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [userHostId, setUserHostId] = useState<string | null>(null);
  const [showMyEvents, setShowMyEvents] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (user) {
      try {
        const response = await fetch("/api/auth/check-admin");
        const data = await response.json();
        setIsAdmin(data.isAdmin);
        setIsSubAdmin(data.isSubAdmin);
        if (data.hostId) {
          setUserHostId(data.hostId);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [eventsData, upcomingData] = await Promise.all([
        api.getEvents("ACTIVE", undefined, "events"),
        api.getEvents("ACTIVE", undefined, "upcoming"),
      ]);

      setEvents(eventsData.events);
      setUpcomingEvents(upcomingData.events);
    } catch (error) {
      showErrorToast("Failed to load events. Please try again.");
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserStatus = (event: Event): "registered" | "waitlisted" | null => {
    if (!user?.email && !(user as any)?.id) return null;
    const email = user?.email?.toLowerCase();
    const userId = (user as any)?.id as string | undefined;

    const matchesPlayer = (p: any) =>
      (email && p?.email?.toLowerCase() === email) ||
      (userId && p?._id?.toString() === userId);

    if (event.registeredPlayers.some(matchesPlayer)) return "registered";
    if (event.waitlist.some(matchesPlayer)) return "waitlisted";
    return null;
  };

  const handleUnregister = async (eventId: string) => {
    try {
      await api.unregisterFromEvent(eventId);
      showSuccessToast("Successfully unregistered from event");
      await fetchEvents();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to unregister from event");
    }
  };

  const handleLeaveWaitlist = async (eventId: string) => {
    try {
      await api.leaveWaitlist(eventId);
      showSuccessToast("Successfully removed from waitlist");
      await fetchEvents();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to leave waitlist");
    }
  };

  // Filter upcoming events based on role:
  // Admin sees all, Sub-Admin sees only their hosted events,
  // regular players see only events they are registered/waitlisted for
  const getVisibleUpcomingEvents = () => {
    if (isAdmin) return upcomingEvents;
    if (isSubAdmin && userHostId) {
      return upcomingEvents.filter((event) => {
        const eventHostId =
          typeof event.host === "object" ? event.host?._id : event.host;
        return eventHostId === userHostId;
      });
    }
    // Regular players: show upcoming events they are registered or waitlisted for
    return upcomingEvents.filter((event) => getUserStatus(event) !== null);
  };

  const visibleUpcomingEvents = getVisibleUpcomingEvents();

  const visibleEvents = showMyEvents
    ? events.filter((e) => getUserStatus(e) !== null)
    : events;

  const visibleUpcomingFiltered = showMyEvents
    ? visibleUpcomingEvents.filter((e) => getUserStatus(e) !== null)
    : visibleUpcomingEvents;

  const myEventsCount = user?.email
    ? [...events, ...visibleUpcomingEvents].filter(
        (e) => getUserStatus(e) !== null,
      ).length
    : 0;

  if (loading) {
    return (
      <div
        className="min-h-screen "
        style={{
          backgroundImage: "url('/assets/Faded-cards-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc2616] mx-auto mb-4"></div>
            <p className="text-black">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0 && visibleUpcomingEvents.length === 0) {
    return (
      <div
        className="min-h-screen "
        style={{
          backgroundImage: "url('/assets/Faded-cards-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center px-4">
            <p className="text-black text-lg sm:text-xl mb-4">
              No upcoming events found
            </p>
            <p className="text-black">Check back later for new events!</p>
          </div>
        </div>
      </div>
    );
  }

  const formatAnnouncementDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div
      className="min-h-screen "
      style={{
        backgroundImage: "url('/assets/Faded-cards-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Navbar />
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-16 lg:px-32 py-10 sm:py-14 pb-24">
        {events.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-[22px] sm:text-[30px] md:text-[36px] font-semibold tracking-wide text-black leading-tight">
                Events
              </h2>
              <div className="flex items-center gap-2">
                {user && (
                  <button
                    onClick={() => setShowMyEvents((v) => !v)}
                    className={`flex items-center gap-2 text-sm sm:text-base font-bold px-4 sm:px-5 py-2.5 rounded-xl border-2 transition-colors ${
                      showMyEvents
                        ? "bg-[#10732e] border-[#10732e] text-white"
                        : "bg-white border-[#10732e] text-[#10732e] hover:bg-green-50"
                    }`}
                  >
                    My Events
                    {myEventsCount > 0 && (
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showMyEvents ? "bg-white text-[#10732e]" : "bg-[#10732e] text-white"}`}
                      >
                        {myEventsCount}
                      </span>
                    )}
                  </button>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/create-event"
                    className="flex items-center gap-2 bg-[#2a558c] hover:bg-[#2a558c]/80 text-white text-sm sm:text-base font-bold px-4 sm:px-6 py-2.5 rounded-xl transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Event
                  </Link>
                )}
              </div>
            </div>
            {visibleEvents.length === 0 && showMyEvents ? (
              <p className="text-black text-base">
                You haven't registered for any events yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
                {visibleEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    id={event._id}
                    isAdmin={isAdmin}
                    title={event.title}
                    date={formatDateInPST(event.dateTime, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    time={formatTimeInPST(event.dateTime, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                    seatsAvailable={event.seatsAvailable}
                    userStatus={getUserStatus(event)}
                    registeredPlayers={event.registeredPlayers
                      .sort((a: any, b: any) =>
                        a.firstName.localeCompare(b.firstName),
                      )
                      .map((player: any) => ({
                        firstName: player.firstName,
                        lastInitial: player.lastName.charAt(0),
                      }))}
                    waitlist={event.waitlist.map((player: any) => ({
                      firstName: player.firstName,
                      lastInitial: player.lastName.charAt(0),
                    }))}
                    bgColor={event.cardBgColor}
                    onUnregister={getUserStatus(event) === 'registered' ? () => handleUnregister(event._id) : undefined}
                    onLeaveWaitlist={getUserStatus(event) === 'waitlisted' ? () => handleLeaveWaitlist(event._id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Events Section - visible to Admins, Sub-Admins, and registered players */}
        {visibleUpcomingFiltered.length > 0 && (
          <div className="mb-12 mt-12">
            <h2 className="font-display text-[22px] sm:text-[30px] md:text-[36px] font-semibold tracking-wide mb-6 text-black leading-tight">
              {isAdmin || isSubAdmin ? "Upcoming Events" : "My Upcoming Events"}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
              {visibleUpcomingFiltered.map((event) => (
                <EventCard
                  key={event._id}
                  id={event._id}
                  isAdmin={isAdmin}
                  title={event.title}
                  date={formatDateInPST(event.dateTime, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  time={formatTimeInPST(event.dateTime, {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                  seatsAvailable={event.seatsAvailable}
                  userStatus={getUserStatus(event)}
                  registeredPlayers={event.registeredPlayers
                    .sort((a: any, b: any) =>
                      a.firstName.localeCompare(b.firstName),
                    )
                    .map((player: any) => ({
                      firstName: player.firstName,
                      lastInitial: player.lastName.charAt(0),
                    }))}
                  waitlist={event.waitlist.map((player: any) => ({
                    firstName: player.firstName,
                    lastInitial: player.lastName.charAt(0),
                  }))}
                  isUpcoming={true}
                  announcementDate={formatAnnouncementDate(
                    event.announcementTier1At,
                  )}
                  bgColor={event.cardBgColor}
                  onUnregister={getUserStatus(event) === 'registered' ? () => handleUnregister(event._id) : undefined}
                  onLeaveWaitlist={getUserStatus(event) === 'waitlisted' ? () => handleLeaveWaitlist(event._id) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mb-12 mt-12">
          <h2 className="font-display text-[22px] sm:text-[30px] md:text-[36px] font-semibold tracking-wide mb-6 text-black leading-tight">
            Recommended
          </h2>
          <div className="flex flex-col gap-2 font-bold">
            <a
              className="text-teal-600 hover:text-teal-700 underline"
              href="https://vancouver.rr-poker.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Runner Runner Vancouver
            </a>
            <a
              className="text-teal-600 hover:text-teal-700 underline"
              href="https://pennyantepoker.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Penny Ante Poker Club Events
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
