"use client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";
import {
  dismissToast,
  showErrorToast,
  showLoadingToast,
  showSuccessToast,
} from "@/lib/toast";
import { formatDateInPST, formatTimeInPST } from "@/lib/utils";
import {
  Archive,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  RotateCcw,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ViewArchivedEvent = () => {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      const response = await api.getEvent(eventId);
      const event = response.event || response;

      console.log("Archived event data:", event);

      if (event.status !== "ARCHIVED") {
        showErrorToast("This event is not archived");
        router.push("/admin");
        return;
      }

      setEventData(event);
    } catch (error: any) {
      console.error("Error fetching event data:", error);
      showErrorToast(error.message || "Failed to load event data");
      router.push("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    const loadingToast = showLoadingToast("Restoring event...");
    try {
      await api.restoreEvent(eventId);
      showSuccessToast("Event restored successfully!");
      router.push("/admin");
    } catch (error: any) {
      showErrorToast(error.message || "Failed to restore event");
    } finally {
      dismissToast(loadingToast);
    }
  };

  const getHostName = () => {
    if (eventData?.host?.user) {
      return `${eventData.host.user.firstName || ""} ${eventData.host.user.lastName || ""}`.trim();
    }
    return "—";
  };

  const getBuyInDisplay = () => {
    if (!eventData?.buyInMin && !eventData?.buyInMax) return "—";
    if (eventData.buyInMin === eventData.buyInMax)
      return `$${eventData.buyInMin}`;
    return `$${eventData.buyInMin} – $${eventData.buyInMax}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f8f6ed" }}>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading event data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!eventData) return null;

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
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-14">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-black hover:text-black mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <Card className="bg-white border-border">
          {/* Header */}
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-700">
                    <Archive className="w-4 h-4" />
                    Archived
                  </span>
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-black mt-3">
                  {eventData.title}
                </h1>
              </div>
              <Button
                type="button"
                className="text-white bg-green-600 hover:bg-green-700"
                onClick={handleRestore}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key details section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-[#cc2616] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Date</p>
                  <p className="text-black font-medium">
                    {formatDateInPST(eventData.dateTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-[#cc2616] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Time (PST)
                  </p>
                  <p className="text-black font-medium">
                    {formatTimeInPST(eventData.dateTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-[#cc2616] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Location
                  </p>
                  <p className="text-black font-medium">{eventData.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-[#cc2616] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Host</p>
                  <p className="text-black font-medium">{getHostName()}</p>
                </div>
              </div>
            </div>

            {/* Game details */}
            <div className="border-t border-gray-200 pt-5">
              <h3 className="text-lg font-bold text-black mb-3">
                Game Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-500">
                    Event Type
                  </p>
                  <p className="text-black font-bold text-lg">
                    {eventData.eventType || "—"}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-500">Buy-in</p>
                  <p className="text-black font-bold text-lg">
                    {getBuyInDisplay()}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-500">
                    Max Players
                  </p>
                  <p className="text-black font-bold text-lg">
                    {eventData.maxPlayers || "—"}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-500">Blinds</p>
                  <p className="text-black font-bold text-lg">
                    {eventData.blinds || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Registered players */}
            {eventData.registeredPlayers?.length > 0 && (
              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-[#cc2616]" />
                  <h3 className="text-lg font-bold text-black">
                    Registered Players ({eventData.registeredPlayers.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {eventData.registeredPlayers.map(
                    (player: any, index: number) => (
                      <div
                        key={player._id || index}
                        className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#2a558c] text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {(player.firstName?.[0] || "").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-black font-medium text-sm">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {player.email}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Details section */}
            {(eventData.details1 ||
              eventData.details2 ||
              eventData.details3) && (
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-lg font-bold text-black mb-3">Details</h3>
                <div className="space-y-2">
                  {eventData.details1 && (
                    <p className="text-gray-700">{eventData.details1}</p>
                  )}
                  {eventData.details2 && (
                    <p className="text-gray-700">{eventData.details2}</p>
                  )}
                  {eventData.details3 && (
                    <p className="text-gray-700">{eventData.details3}</p>
                  )}
                </div>
              </div>
            )}

            {/* Links */}
            {eventData.links?.length > 0 &&
              eventData.links.some((l: any) => l.label && l.url) && (
                <div className="border-t border-gray-200 pt-5">
                  <h3 className="text-lg font-bold text-black mb-3">
                    Event Links
                  </h3>
                  <div className="space-y-2">
                    {eventData.links
                      .filter((link: any) => link.label && link.url)
                      .map((link: any, index: number) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#2a558c] hover:underline font-medium"
                        >
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          {link.label}
                        </a>
                      ))}
                  </div>
                </div>
              )}

            {/* Announcement dates */}
            {(eventData.announcementTier1At ||
              eventData.announcementTier2At ||
              eventData.announcementPostAt ||
              eventData.reminderAt) && (
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-lg font-bold text-black mb-3">
                  Scheduled Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {eventData.announcementTier1At && (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-500">
                        Announcement Tier 1
                      </p>
                      <p className="text-black font-medium">
                        {formatDateInPST(eventData.announcementTier1At)}
                      </p>
                    </div>
                  )}
                  {eventData.announcementTier2At && (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-500">
                        Announcement Tier 2
                      </p>
                      <p className="text-black font-medium">
                        {formatDateInPST(eventData.announcementTier2At)}
                      </p>
                    </div>
                  )}
                  {eventData.announcementPostAt && (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-500">
                        Announcement Post
                      </p>
                      <p className="text-black font-medium">
                        {formatDateInPST(eventData.announcementPostAt)}
                      </p>
                    </div>
                  )}
                  {eventData.reminderAt && (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-500">
                        Reminder
                      </p>
                      <p className="text-black font-medium">
                        {formatDateInPST(eventData.reminderAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom action */}
            <div className="border-t border-gray-200 pt-5 flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-black"
                onClick={() => router.push("/admin")}
                style={{ backgroundColor: "#f8f6ed" }}
              >
                Back to Admin
              </Button>
              <Button
                type="button"
                className="flex-1 text-white bg-green-600 hover:bg-green-700"
                onClick={handleRestore}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewArchivedEvent;
