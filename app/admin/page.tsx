"use client";
import { DeleteEventModal } from "@/components/DeleteEventModal";
import { DeleteUserModal } from "@/components/DeleteUserModal";
import { EditPhoneModal } from "@/components/EditPhoneModal";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import {
  dismissToast,
  showErrorToast,
  showLoadingToast,
  showSuccessToast,
} from "@/lib/toast";
import { formatDateInPST } from "@/lib/utils";
import {
  AlertTriangle,
  Archive,
  ArrowUpDown,
  CalendarDays,
  Camera,
  Check,
  Copy,
  Download,
  Edit3,
  Eye,
  Mail,
  MapPinHouse,
  Megaphone,
  Pencil,
  Play,
  Plus,
  Save,
  Trash2,
  Users,
  UserX,
  X,
  Armchair,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: "MEMBER" | "ADMIN" | "SUB_ADMIN";
  notes?: string;
  approvalStatus: "PENDING" | "APPROVED" | "DENIED";
  createdAt: string;
}

interface Event {
  _id: string;
  title: string;
  dateTime: string;
  location: string;
  buyInMin: number;
  buyInMax: number;
  maxPlayers: number;
  eventType: string;
  blinds?: string;
  status: "ACTIVE" | "ARCHIVED";
  registeredPlayers: any[];
  invitedPlayers: any[];
  seatsAvailable: number;
  announcementSent?: boolean;
}

interface EmailLogDetail {
  eventId?: string;
  eventTitle: string;
  type: string;
  subject?: string;
  emailsSent: number;
  recipients?: { name: string; email: string }[];
}

interface EmailLog {
  _id: string;
  runAt: string;
  triggeredBy: "github-cron" | "in-app-manual-cron" | "watchdog-cron";
  eventsProcessed: number;
  emailsSent: number;
  details: EmailLogDetail[];
  error?: string;
  success: boolean;
}

  interface EmailEvent {
    _id: string;
    title: string;
    dateTime: string;
  announcementTier1At?: string;
  announcementTier1Sent?: boolean;
  announcementTier2At?: string;
  announcementTier2Sent?: boolean;
  announcementPostAt?: string;
  announcementPostSent?: boolean;
  reminderAt?: string;
    reminderSent?: boolean;
  }

interface RegistrationLog {
  _id: string;
  event: { _id: string; title: string; dateTime?: string; location?: string } | string;
  eventTitle: string;
  user: { _id: string; firstName: string; lastName: string; email: string } | string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  action: string;
  actorEmail?: string;
  createdAt: string;
  note?: string;
}

interface Host {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  address?: string;
  tier1: Array<{ _id: string } | string>;
  tier2: Array<{ _id: string } | string>;
}

interface Photo {
  _id: string;
  cloudinaryUrl: string;
  originalName: string;
  fileSize: number;
  caption?: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  uploadedBy: { firstName: string; lastName: string; email: string };
  approvedBy?: { firstName: string; lastName: string };
  approvedAt?: string;
  createdAt: string;
}

type FilterStatus = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

const Admin = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [hosts, setHosts] = useState<User[]>([]);
  const [rawEvents, setRawEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventSortBy, setEventSortBy] = useState<"date" | "status">("date");
  const [eventSortOrder, setEventSortOrder] = useState<"asc" | "desc">("asc");
  const [userSortBy, setUserSortBy] = useState<"firstName" | "status" | null>(
    null,
  );
  const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedSection, setSelectedSection] = useState<
    "events" | "members" | "hosts" | "emails" | "registrations" | "photos"
  >("events");
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailEvents, setEmailEvents] = useState<EmailEvent[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);
  const [registrationLogs, setRegistrationLogs] = useState<RegistrationLog[]>([]);
  const [registrationLogsLoading, setRegistrationLogsLoading] = useState(false);
  const [registrationLogEventId, setRegistrationLogEventId] = useState("");
  const [registrationLogUserId, setRegistrationLogUserId] = useState("");
  const [registrationLogAction, setRegistrationLogAction] = useState("");
  const [runningCron, setRunningCron] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  // Gap days (no DB record) dismissed by the admin — persisted in DB
  const [dismissedDays, setDismissedDays] = useState<Set<string>>(new Set());
  // Tracks which event schedule modals the admin has opened — persisted in DB
  const [seenEventIds, setSeenEventIds] = useState<Set<string>>(new Set());
  const [recipientModal, setRecipientModal] = useState<{
    detail: EmailLogDetail;
  } | null>(null);
  const [eventScheduleModal, setEventScheduleModal] =
    useState<EmailEvent | null>(null);
  const [eventTab, setEventTab] = useState<"active" | "archived">("active");
  const [editPhoneModal, setEditPhoneModal] = useState({
    isOpen: false,
    userId: "",
    currentPhone: "",
    currentFirstName: "",
    currentLastName: "",
    currentEmail: "",
    currentNotes: "",
    currentRole: "MEMBER" as "ADMIN" | "MEMBER" | "SUB_ADMIN",
  });
  const [deleteEventModal, setDeleteEventModal] = useState({
    isOpen: false,
    eventId: "",
    eventTitle: "",
  });
  const [deleteUserModal, setDeleteUserModal] = useState({
    isOpen: false,
    userId: "",
    userName: "",
    userEmail: "",
  });

  // ── Photos state ──────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<FilterStatus>("PENDING");
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      setPhotosLoading(true);
      const status = photoFilter === "ALL" ? undefined : photoFilter;
      const data = await api.getAdminPhotos(status);
      setPhotos(data.photos);
    } catch {
      showErrorToast("Failed to load photos.");
    } finally {
      setPhotosLoading(false);
    }
  }, [photoFilter]);

  const fetchRegistrationLogs = useCallback(async () => {
    try {
      setRegistrationLogsLoading(true);
      const data = await api.getRegistrationLogs({
        eventId: registrationLogEventId.trim() || undefined,
        userId: registrationLogUserId.trim() || undefined,
        action: registrationLogAction.trim() || undefined,
        limit: 100,
      });
      setRegistrationLogs(data.logs || []);
    } catch {
      showErrorToast("Failed to load registration logs.");
    } finally {
      setRegistrationLogsLoading(false);
    }
  }, [registrationLogAction, registrationLogEventId, registrationLogUserId]);

  const registrationLogSummary = useMemo(() => {
    const total = registrationLogs.length;
    const registered = registrationLogs.filter((log) =>
      log.action.includes("REGISTERED"),
    ).length;
    const waitlisted = registrationLogs.filter((log) =>
      log.action.includes("WAITLIST"),
    ).length;
    const unregistered = registrationLogs.filter((log) =>
      log.action.includes("UNREGISTERED") || log.action.includes("REMOVED"),
    ).length;
    const latest = registrationLogs[0]?.createdAt
      ? formatDateInPST(registrationLogs[0].createdAt)
      : null;

    return { total, registered, waitlisted, unregistered, latest };
  }, [registrationLogs]);

  useEffect(() => {
    if (selectedSection === "photos") fetchPhotos();
    if (selectedSection === "registrations") fetchRegistrationLogs();
  }, [selectedSection, fetchPhotos, fetchRegistrationLogs]);

  const handleApprovePhoto = async (id: string) => {
    try {
      await api.approvePhoto(id);
      showSuccessToast("Photo approved");
      fetchPhotos();
    } catch {
      showErrorToast("Failed to approve photo");
    }
  };

  const handleRejectPhoto = async (id: string) => {
    try {
      await api.rejectPhoto(id);
      showSuccessToast("Photo rejected");
      fetchPhotos();
    } catch {
      showErrorToast("Failed to reject photo");
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this photo?")) return;
    try {
      await api.deletePhoto(id);
      showSuccessToast("Photo deleted");
      fetchPhotos();
    } catch {
      showErrorToast("Failed to delete photo");
    }
  };

  const handleSaveCaption = async (id: string) => {
    try {
      await api.updatePhotoCaption(id, captionText);
      showSuccessToast("Caption updated");
      setEditingCaption(null);
      fetchPhotos();
    } catch {
      showErrorToast("Failed to update caption");
    }
  };

  const startEditCaption = (photo: Photo) => {
    setEditingCaption(photo._id);
    setCaptionText(photo.caption || "");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const photoStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchData();
    fetchEmailLogs();
    fetchRegistrationLogs();
  }, []);

  const persistSeenEventIds = async (ids: Set<string>) => {
    try {
      await api.updateDismissals({ seenEventIds: Array.from(ids) });
    } catch (error) {
      console.error("Error persisting seenEventIds:", error);
    }
  };

  const persistDismissedDays = async (days: Set<string>) => {
    try {
      await api.updateDismissals({ dismissedDays: Array.from(days) });
    } catch (error) {
      console.error("Error persisting dismissedDays:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, eventsData, hostsData] = await Promise.all([
        api.getUsers(),
        api.getEvents(),
        api.getAllHosts(),
      ]);

      setUsers(usersData.users);
      setRawEvents(eventsData.events);
      setHosts(hostsData.hosts);
    } catch (error) {
      showErrorToast("Failed to load admin data. Please try again.");
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      setEmailLogsLoading(true);
      const [data, dismissals] = await Promise.all([
        api.getEmailLogs(),
        api.getDismissals(),
      ]);
      setEmailLogs(data.logs || []);
      setEmailEvents(data.events || []);
      if (dismissals.seenEventIds?.length) {
        setSeenEventIds(new Set(dismissals.seenEventIds));
      }
      if (dismissals.dismissedDays?.length) {
        setDismissedDays(new Set(dismissals.dismissedDays));
      }
    } catch (error) {
      showErrorToast("Failed to load email logs.");
    } finally {
      setEmailLogsLoading(false);
    }
  };

  const handleRunCron = async () => {
    setRunningCron(true);
    const loadingToast = showLoadingToast("Running email cron...");
    try {
      const result = await api.runCronManually();
      showSuccessToast(
        `Done — ${result.emailsSent} email(s) sent across ${result.eventsProcessed} event(s).`,
      );
      await fetchEmailLogs();
    } catch (error: any) {
      showErrorToast(error.message || "Cron run failed.");
    } finally {
      dismissToast(loadingToast);
      setRunningCron(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    setDeletingLogId(id);
    try {
      await api.deleteEmailLog(id);
      setEmailLogs((prev) => prev.filter((l) => l._id !== id));
      if (expandedLog === id) setExpandedLog(null);
    } catch (error: any) {
      showErrorToast(error.message || "Failed to delete log.");
    } finally {
      setDeletingLogId(null);
    }
  };

  const handleArchiveEvent = async (eventId: string) => {
    const loadingToast = showLoadingToast("Archiving event...");

    try {
      await api.archiveEvent(eventId);
      showSuccessToast("Event archived successfully");
      await fetchData();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to archive event");
    } finally {
      dismissToast(loadingToast);
    }
  };

  const handleEditPhone = (user: User) => {
    const modalData = {
      isOpen: true,
      userId: user._id,
      currentPhone: user.phoneNumber,
      currentFirstName: user.firstName,
      currentLastName: user.lastName,
      currentEmail: user.email,
      currentNotes: user.notes || "",
      currentRole: user.role,
    };

    setEditPhoneModal(modalData);
  };

  const handlePhoneUpdate = () => {
    fetchData();
  };

  const handleDeleteUser = (user: User) => {
    setDeleteUserModal({
      isOpen: true,
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
    });
  };

  const handleConfirmDeleteUser = async () => {
    const { userId, userName } = deleteUserModal;

    const loadingToast = showLoadingToast("Deleting user...");

    try {
      await api.hardDeleteUser(userId);
      showSuccessToast(`User ${userName} permanently deleted successfully`);
      await fetchData();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to delete user");
    } finally {
      dismissToast(loadingToast);
      setDeleteUserModal({
        isOpen: false,
        userId: "",
        userName: "",
        userEmail: "",
      });
    }
  };

  const handleDuplicateEvent = async (eventId: string, eventTitle: string) => {
    const loadingToast = showLoadingToast("Duplicating event...");

    try {
      await api.duplicateEvent(eventId);
      showSuccessToast(`Event "${eventTitle}" duplicated successfully`);
      await fetchData();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to duplicate event");
    } finally {
      dismissToast(loadingToast);
    }
  };

  const handleEditEvent = (eventId: string, status: string) => {
    if (status === "ARCHIVED") {
      showErrorToast("Cannot edit archived events");
    } else {
      router.push(`/admin/edit-event/${eventId}`);
    }
  };

  const handleApproveUser = async (userId: string) => {
    const loadingToast = showLoadingToast("Approving user...");

    try {
      await api.approveUser(userId);
      showSuccessToast("User approved successfully");
      await fetchData();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to approve user");
    } finally {
      dismissToast(loadingToast);
    }
  };

  const handleDenyUser = async (userId: string) => {
    const loadingToast = showLoadingToast("Denying user...");

    try {
      await api.denyUser(userId);
      showSuccessToast("User denied successfully");
      await fetchData();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to deny user");
    } finally {
      dismissToast(loadingToast);
    }
  };

  const handleExportCSV = async () => {
    try {
      window.open("/api/admin/users/export/csv", "_blank");
      showSuccessToast("CSV export started");
    } catch (error: any) {
      showErrorToast(error.message || "Failed to export CSV");
    }
  };

  const handleExportPDF = async () => {
    try {
      window.open("/api/admin/users/export/pdf", "_blank");
      showSuccessToast("PDF export started");
    } catch (error: any) {
      showErrorToast(error.message || "Failed to export PDF");
    }
  };

  const handleSendAnnouncement = async (
    eventId: string,
    eventTitle: string,
  ) => {
    const loadingToast = showLoadingToast("Sending event announcement...");

    try {
      await api.sendEventAnnouncement(eventId);
      showSuccessToast(`Event announcement sent for ${eventTitle}`);
      await fetchData();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to send event announcement");
    } finally {
      dismissToast(loadingToast);
    }
  };

  const handleSendOpenSeatNotification = async (
    eventId: string,
    eventTitle: string,
  ) => {
    const loadingToast = showLoadingToast("Sending open-seat notification...");

    try {
      const result = await api.sendOpenSeatNotification(eventId);
      showSuccessToast(
        `Open-seat notification sent to ${result.emailsSent} member${result.emailsSent !== 1 ? "s" : ""} for "${eventTitle}"`,
      );
    } catch (error: any) {
      showErrorToast(error.message || "Failed to send open-seat notification");
    } finally {
      dismissToast(loadingToast);
    }
  };

  const handleSortEvents = (sortBy: "date" | "status") => {
    if (eventSortBy === sortBy) {
      setEventSortOrder(eventSortOrder === "asc" ? "desc" : "asc");
    } else {
      setEventSortBy(sortBy);
      setEventSortOrder(sortBy === "date" ? "desc" : "asc");
    }
  };

  const handleSortUsers = (sortBy: "firstName" | "status") => {
    if (userSortBy === sortBy) {
      setUserSortOrder(userSortOrder === "asc" ? "desc" : "asc");
    } else {
      setUserSortBy(sortBy);
      setUserSortOrder(sortBy === "firstName" ? "desc" : "asc");
    }
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    setDeleteEventModal({
      isOpen: true,
      eventId,
      eventTitle,
    });
  };

  const handleConfirmDelete = async () => {
    const { eventId, eventTitle } = deleteEventModal;
    const event = rawEvents.find((e) => e._id === eventId);

    if (!event) {
      showErrorToast("Event not found");
      setDeleteEventModal({ isOpen: false, eventId: "", eventTitle: "" });
      return;
    }

    if (event.status !== "ARCHIVED") {
      showErrorToast("Only archived events can be deleted");
      setDeleteEventModal({ isOpen: false, eventId: "", eventTitle: "" });
      return;
    }

    const loadingToast = showLoadingToast("Deleting archived event...");

    try {
      await api.hardDeleteEvent(eventId);
      showSuccessToast("Archived event permanently deleted successfully");
      await fetchData();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to delete archived event");
    } finally {
      dismissToast(loadingToast);
      setDeleteEventModal({ isOpen: false, eventId: "", eventTitle: "" });
    }
  };

  const sortedEvents = useMemo(() => {
    if (!rawEvents.length) return [];

    let sorted = [...rawEvents];

    if (eventSortBy === "status") {
      sorted.sort((a, b) => {
        if (eventSortOrder === "asc") {
          return a.status.localeCompare(b.status);
        } else {
          return b.status.localeCompare(a.status);
        }
      });
    } else {
      sorted.sort((a, b) => {
        // Primary sort: status (ACTIVE = 0, ARCHIVED = 1)
        const statusOrder: Record<string, number> = { ACTIVE: 0, ARCHIVED: 1 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;

        // Secondary sort: date
        const dateA = new Date(a.dateTime).getTime();
        const dateB = new Date(b.dateTime).getTime();
        if (eventSortOrder === "asc") {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
    }

    return sorted;
  }, [rawEvents, eventSortBy, eventSortOrder]);

  const activeEvents = useMemo(
    () => sortedEvents.filter((e) => e.status !== "ARCHIVED"),
    [sortedEvents],
  );
  const archivedEvents = useMemo(
    () => sortedEvents.filter((e) => e.status === "ARCHIVED"),
    [sortedEvents],
  );
  const displayedEvents = eventTab === "active" ? activeEvents : archivedEvents;

  const sortedUsersForHosts = useMemo(() => {
    return [...users].sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [users]);

  const sortedUsers = useMemo(() => {
    if (!users.length) return [];
    let sorted = [...users];

    if (userSortBy === null) {
      sorted.sort((a, b) => {
        const statusComparison = b.approvalStatus.localeCompare(
          a.approvalStatus,
        );
        if (statusComparison !== 0) {
          return statusComparison;
        }
        return a.firstName.localeCompare(b.firstName);
      });
    } else if (userSortBy === "status") {
      sorted.sort((a, b) => {
        if (userSortOrder === "asc") {
          return a.approvalStatus.localeCompare(b.approvalStatus);
        } else {
          return b.approvalStatus.localeCompare(a.approvalStatus);
        }
      });
    } else if (userSortBy === "firstName") {
      sorted.sort((a, b) => {
        if (userSortOrder === "asc") {
          return a.firstName.localeCompare(b.firstName);
        } else {
          return b.firstName.localeCompare(a.firstName);
        }
      });
    }
    return sorted;
  }, [users, userSortBy, userSortOrder]);

  const toIds = (arr: any[]) =>
    (arr || [])
      .map((x) => (typeof x === "string" ? x : x?._id))
      .filter(Boolean);

  const updateHostTier = async (
    hostId: string,
    userId: string,
    tier: "tier1" | "tier2",
    checked: boolean,
  ) => {
    const host: any = hosts.find((h) => h._id === hostId);
    if (!host) return;

    const tier1 = toIds(host.tier1);
    const tier2 = toIds(host.tier2);
    const addUnique = (arr: string[], id: string) =>
      Array.from(new Set([...arr, id]));
    const removeId = (arr: string[], id: string) => arr.filter((x) => x !== id);
    let nextTier1 = tier1;
    let nextTier2 = tier2;

    if (tier === "tier1") {
      if (checked) {
        nextTier1 = addUnique(tier1, userId);
        nextTier2 = removeId(tier2, userId);
      } else {
        nextTier1 = removeId(tier1, userId);
      }
    }

    if (tier === "tier2") {
      if (checked) {
        nextTier2 = addUnique(tier2, userId);
        nextTier1 = removeId(tier1, userId);
      } else {
        nextTier2 = removeId(tier2, userId);
      }
    }

    setHosts((prev) =>
      prev.map((h) =>
        h._id === hostId ? { ...h, tier1: nextTier1, tier2: nextTier2 } : h,
      ),
    );

    try {
      await api.updateTierHost(hostId, nextTier1, nextTier2);
      const hostsData = await api.getAllHosts();
      setHosts(hostsData.hosts);
    } catch (e) {
      console.error("updateHostTier failed:", e);
      const hostsData = await api.getAllHosts();
      setHosts(hostsData.hosts);
    }
  };

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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc2616] mx-auto mb-4"></div>
            <p className="text-black">Loading admin data...</p>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="w-full px-4 sm:px-10 md:px-16 lg:px-32 pt-5 pb-14">
        <div className="space-y-5">
          <div>
            <ul className="flex -mb-px text-sm font-medium text-center text-body">
              <li className="flex-1 sm:flex-none">
                <a
                  className={`flex gap-1.5 sm:gap-2 items-center justify-center px-2 py-3 sm:p-4 font-semibold border-b-2 text-sm sm:text-lg hover:cursor-pointer
                     ${selectedSection == "events" ? "text-[#14532d] border-[#14532d]" : "text-gray-500 border-transparent"}
                    `}
                  onClick={() => setSelectedSection("events")}
                >
                  <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
                  Events
                </a>
              </li>
              <li className="flex-1 sm:flex-none">
                <a
                  className={`flex gap-1.5 sm:gap-2 items-center justify-center px-2 py-3 sm:p-4 font-semibold border-b-2 text-sm sm:text-lg hover:cursor-pointer
                     ${selectedSection == "members" ? "text-[#14532d] border-[#14532d]" : "text-gray-500 border-transparent"}
                    `}
                  onClick={() => setSelectedSection("members")}
                >
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  Members
                </a>
              </li>
              <li className="flex-1 sm:flex-none">
                <a
                  className={`flex gap-1.5 sm:gap-2 items-center justify-center px-2 py-3 sm:p-4 font-semibold border-b-2 text-sm sm:text-lg hover:cursor-pointer
                     ${selectedSection == "hosts" ? "text-[#14532d] border-[#14532d]" : "text-gray-500 border-transparent"}
                    `}
                  onClick={() => setSelectedSection("hosts")}
                >
                  <MapPinHouse className="w-5 h-5 sm:w-6 sm:h-6" />
                  Hosts
                </a>
              </li>
              <li className="flex-1 sm:flex-none">
                <a
                  className={`relative flex gap-1.5 sm:gap-2 items-center justify-center px-2 py-3 sm:p-4 font-semibold border-b-2 text-sm sm:text-lg hover:cursor-pointer
                     ${selectedSection == "emails" ? "text-[#14532d] border-[#14532d]" : "text-gray-500 border-transparent"}
                    `}
                  onClick={() => {
                    setSelectedSection("emails");
                    fetchEmailLogs();
                  }}
                >
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                  Emails
                  {(() => {
                    const now = new Date();
                    const count = emailEvents.filter(
                      (ev) =>
                        !seenEventIds.has(ev._id) &&
                        [
                          { date: ev.announcementTier1At, sent: ev.announcementTier1Sent },
                          { date: ev.announcementTier2At, sent: ev.announcementTier2Sent },
                          { date: ev.announcementPostAt,  sent: ev.announcementPostSent  },
                          { date: ev.reminderAt,          sent: ev.reminderSent          },
                        ].some(({ date, sent }) => date && !sent && new Date(date) < now),
                    ).length;
                    if (!count) return null;
                    return (
                      <span className="absolute -top-0.5 -right-1 sm:relative sm:top-auto sm:right-auto sm:ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {count}
                      </span>
                    );
                  })()}
                </a>
              </li>
              <li className="flex-1 sm:flex-none">
                <a
                  className={`flex gap-1.5 sm:gap-2 items-center justify-center px-2 py-3 sm:p-4 font-semibold border-b-2 text-sm sm:text-lg hover:cursor-pointer
                     ${selectedSection == "registrations" ? "text-[#14532d] border-[#14532d]" : "text-gray-500 border-transparent"}
                    `}
                  onClick={() => {
                    setSelectedSection("registrations");
                    fetchRegistrationLogs();
                  }}
                >
                  <ArrowUpDown className="w-5 h-5 sm:w-6 sm:h-6" />
                  Registrations
                </a>
              </li>
              <li className="flex-1 sm:flex-none">
                <a
                  className={`flex gap-1.5 sm:gap-2 items-center justify-center px-2 py-3 sm:p-4 font-semibold border-b-2 text-sm sm:text-lg hover:cursor-pointer
                     ${selectedSection == "photos" ? "text-[#14532d] border-[#14532d]" : "text-gray-500 border-transparent"}
                    `}
                  onClick={() => setSelectedSection("photos")}
                >
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                  Photos
                </a>
              </li>
            </ul>
          </div>
          {selectedSection === "events" && (
            <Card id="events-section" className="bg-white border-gray-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-7 h-7 text-[#cc2616]" />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEventTab("active")}
                        className={`text-xl md:text-2xl font-bold tracking-wide px-2 py-1 rounded-lg transition-colors ${eventTab === "active" ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
                      >
                        Events ({activeEvents.length})
                      </button>
                      <span className="text-gray-300 font-light text-xl">
                        |
                      </span>
                      <button
                        type="button"
                        onClick={() => setEventTab("archived")}
                        className={`text-xl md:text-2xl font-bold tracking-wide px-2 py-1 rounded-lg transition-colors ${eventTab === "archived" ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
                      >
                        Archived ({archivedEvents.length})
                      </button>
                    </div>
                  </div>

                  {/* Create Event Button Bigger */}
                  <Button
                    asChild
                    className="bg-[#2a558c] hover:bg-[#2a558c]/80 text-white text-lg font-bold px-6 py-3 rounded-xl"
                  >
                    <Link
                      href="/admin/create-event"
                      className="flex items-center"
                    >
                      <Plus className="w-8 h-8 mr-2" />
                      Create Event
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* ── Mobile card view ── */}
                <div className="md:hidden space-y-3">
                  {displayedEvents.map((event) => (
                    <div
                      key={event._id}
                      className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/events/${event._id}`)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-black text-sm leading-tight">
                          {event.title}
                        </h3>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold ${
                            event.status === "ACTIVE"
                              ? "text-red-800"
                              : "text-gray-800"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                        <span>{formatDateInPST(event.dateTime)}</span>
                        <span>
                          Seats:{" "}
                          <strong className="text-[#cc2616]">
                            {event.seatsAvailable}
                          </strong>
                        </span>
                        <span>
                          Buy-in:{" "}
                          <strong>
                            ${event.buyInMin}
                            {event.buyInMin !== event.buyInMax &&
                              `–$${event.buyInMax}`}
                          </strong>
                        </span>
                        <span>
                          Max: <strong>{event.maxPlayers}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                        <TooltipProvider delayDuration={200}>
                          {event.status === "ACTIVE" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendAnnouncement(
                                      event._id,
                                      event.title,
                                    );
                                  }}
                                  disabled={event.announcementSent}
                                >
                                  <Megaphone className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {event.announcementSent
                                  ? "Announcement already sent"
                                  : "Send announcement"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {event.status === "ACTIVE" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-orange-500 hover:text-orange-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendOpenSeatNotification(
                                      event._id,
                                      event.title,
                                    );
                                  }}
                                >
                                  <Armchair className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Notify members of open seat
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateEvent(event._id, event.title);
                                }}
                              >
                                <Copy className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duplicate event</TooltipContent>
                          </Tooltip>
                          {event.status !== "ARCHIVED" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-black"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(event._id, event.status);
                                  }}
                                >
                                  <Pencil className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit event</TooltipContent>
                            </Tooltip>
                          )}
                          {event.status === "ACTIVE" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveEvent(event._id);
                                  }}
                                >
                                  <Archive className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Archive event</TooltipContent>
                            </Tooltip>
                          )}
                          {event.status === "ARCHIVED" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/admin/archived-events/${event._id}`,
                                    );
                                  }}
                                >
                                  <Eye className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                View archived event
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {event.status === "ARCHIVED" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event._id, event.title);
                                  }}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete event</TooltipContent>
                            </Tooltip>
                          )}
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Desktop table view ── */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-300 hover:bg-gray-200 transition-colors">
                        <TableHead className="text-base md:text-lg font-bold text-black w-72">
                          Event Title
                        </TableHead>
                        <TableHead
                          className="text-base md:text-lg font-bold text-black w-60 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSortEvents("date")}
                        >
                          <div className="flex items-center gap-2">
                            Date
                            <ArrowUpDown
                              className={`w-4 h-4 ${eventSortBy === "date" ? "text-[#cc2616]" : "text-gray-400"}`}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-base md:text-lg font-bold text-black">
                          Seats Left
                        </TableHead>
                        <TableHead className="text-base md:text-lg font-bold text-black">
                          Buy-in
                        </TableHead>
                        <TableHead className="text-base md:text-lg font-bold text-black">
                          Max Players
                        </TableHead>
                        <TableHead
                          className="text-base md:text-lg font-bold text-black cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSortEvents("status")}
                        >
                          <div className="flex items-center gap-2">
                            Status
                            <ArrowUpDown
                              className={`w-4 h-4 ${eventSortBy === "status" ? "text-[#cc2616]" : "text-gray-400"}`}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-center text-base md:text-lg font-bold text-black">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {displayedEvents.map((event) => (
                        <TableRow
                          key={event._id}
                          className="border-b border-gray-300 opacity-90 hover:bg-gray-200 transition-colors cursor-pointer"
                          onClick={() => router.push(`/events/${event._id}`)}
                        >
                          <TableCell className="text-sm md:text-base font-semibold text-black">
                            {event.title}
                          </TableCell>
                          <TableCell className="text-sm md:text-base text-gray-600 font-medium">
                            {formatDateInPST(event.dateTime)}
                          </TableCell>
                          <TableCell>
                            {/* Seats Badge Bigger */}
                            <span className=" text-[#cc2616] px-3 py-1 rounded-md text-sm md:text-base font-bold">
                              {event.seatsAvailable}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm md:text-base text-gray-600 font-bold w-32">
                            ${event.buyInMin}
                            {event.buyInMin !== event.buyInMax &&
                              ` – $${event.buyInMax}`}
                          </TableCell>
                          <TableCell className="text-sm md:text-base text-gray-600 font-medium">
                            {event.maxPlayers}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-sm md:text-base font-bold ${
                                event.status === "ACTIVE"
                                  ? " text-red-800"
                                  : " text-gray-800"
                              }`}
                            >
                              {event.status}
                            </span>
                          </TableCell>

                          {/* Bigger Icons for Actions */}
                          <TableCell className="text-right">
                            <TooltipProvider delayDuration={200}>
                              <div className="flex items-center justify-end gap-3">
                                {/* Send Announcement Button */}
                                {event.status === "ACTIVE" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendAnnouncement(
                                            event._id,
                                            event.title,
                                          );
                                        }}
                                        disabled={event.announcementSent}
                                      >
                                        <Megaphone className="w-7 h-7" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {event.announcementSent
                                        ? "Announcement already sent"
                                        : "Send announcement"}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {/* Open Seat Notification Button */}
                                {event.status === "ACTIVE" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-orange-500 hover:text-orange-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendOpenSeatNotification(
                                            event._id,
                                            event.title,
                                          );
                                        }}
                                      >
                                        <Armchair className="w-7 h-7" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Notify members of open seat
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicateEvent(
                                          event._id,
                                          event.title,
                                        );
                                      }}
                                    >
                                      <Copy className="w-7 h-7" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Duplicate event
                                  </TooltipContent>
                                </Tooltip>
                                {event.status !== "ARCHIVED" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-black"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditEvent(
                                            event._id,
                                            event.status,
                                          );
                                        }}
                                      >
                                        <Pencil className="w-7 h-7" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit event</TooltipContent>
                                  </Tooltip>
                                )}
                                {event.status === "ACTIVE" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleArchiveEvent(event._id);
                                        }}
                                      >
                                        <Archive className="w-7 h-7" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Archive event
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {event.status === "ARCHIVED" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(
                                            `/admin/archived-events/${event._id}`,
                                          );
                                        }}
                                      >
                                        <Eye className="w-7 h-7" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      View archived event
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {event.status === "ARCHIVED" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteEvent(
                                            event._id,
                                            event.title,
                                          );
                                        }}
                                      >
                                        <Trash2 className="w-7 h-7" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Delete event
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          {selectedSection === "members" && (
            <Card
              id="members-section"
              className="border-0"
              style={{ backgroundColor: "#fff" }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-7 h-7 text-[#cc2616]" />
                    <h2 className="text-black text-xl md:text-2xl font-bold tracking-wide">
                      Members ({sortedUsers.length})
                    </h2>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleExportCSV()}
                      variant="outline"
                      className="text-sm font-bold px-4 py-2"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Export CSV
                    </Button>
                    {/* <Button
                        onClick={() => handleExportPDF()}
                        variant="outline"
                        className="text-sm font-bold px-4 py-2"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Export PDF
                      </Button> */}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-gray-200 transition-colors">
                        <TableHead
                          className="text-base text-black md:text-lg font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSortUsers("firstName")}
                        >
                          <div className="flex items-center gap-2">
                            First Name
                            <ArrowUpDown
                              className={`w-4 h-4 ${userSortBy === "firstName" ? "text-[#cc2616]" : "text-gray-400"}`}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-base text-black md:text-lg font-bold">
                          Last Name
                        </TableHead>
                        <TableHead className="text-base text-black md:text-lg font-bold">
                          Email
                        </TableHead>
                        <TableHead className="text-base text-black md:text-lg font-bold">
                          Phone
                        </TableHead>
                        <TableHead
                          className="text-base text-black md:text-lg font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSortUsers("status")}
                        >
                          <div className="flex items-center gap-2">
                            Status
                            <ArrowUpDown
                              className={`w-4 h-4 ${userSortBy === "status" ? "text-[#cc2616]" : "text-gray-400"}`}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-base text-black md:text-lg font-bold">
                          Role
                        </TableHead>
                        <TableHead className="text-base text-black md:text-lg font-bold">
                          Actions
                        </TableHead>
                        <TableHead className="text-base text-black md:text-lg font-bold">
                          Notes
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUsers.map((user) => (
                        <TableRow
                          key={user._id}
                          className="border-b text-black border-border opacity-90 hover:bg-gray-200 transition-colors cursor-pointer"
                          onClick={() => handleEditPhone(user)}
                        >
                          <TableCell className="text-sm text-black md:text-base font-medium">
                            {user.firstName}
                          </TableCell>
                          <TableCell className="text-sm text-black md:text-base font-medium">
                            {user.lastName}
                          </TableCell>
                          <TableCell className="text-sm text-black md:text-base font-medium">
                            {user.email}
                          </TableCell>
                          <TableCell className="text-sm text-black md:text-base font-medium">
                            {user.phoneNumber}
                          </TableCell>
                          <TableCell className="text-sm md:text-base font-semibold">
                            <span
                              className={`px-2 py-1 rounded ${
                                user.approvalStatus === "APPROVED"
                                  ? "text-green-600 hover:text-green-700"
                                  : user.approvalStatus === "DENIED"
                                    ? " text-red-800"
                                    : " text-yellow-800"
                              }`}
                            >
                              {user.approvalStatus}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm md:text-base font-medium">
                            {user.role === "ADMIN"
                              ? "Admin"
                              : user.role === "SUB_ADMIN"
                                ? "Sub Admin"
                                : "Member"}
                          </TableCell>
                          <TableCell className="text-sm md:text-base font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {user.approvalStatus === "PENDING" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproveUser(user._id);
                                    }}
                                  >
                                    <Check className="w-7 h-7" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDenyUser(user._id);
                                    }}
                                  >
                                    <X className="w-7 h-7" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPhone(user);
                                }}
                              >
                                <Pencil className="w-7 h-7" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(user);
                                }}
                              >
                                <UserX className="w-7 h-7" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-black md:text-base font-medium">
                            {user.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          {selectedSection === "hosts" && (
            <Card
              id="hosts-section"
              className="border-0"
              style={{ backgroundColor: "#fff" }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPinHouse className="w-7 h-7 text-[#cc2616]" />
                    <h2 className="text-black text-xl md:text-2xl font-bold tracking-wide">
                      Hosts ({hosts.length})
                    </h2>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-300 hover:bg-gray-200 transition-colors hover:bg-transparent">
                        <TableHead
                          className="text-base font-bold text-gray-700 w-5"
                          rowSpan={2}
                        >
                          First Name
                        </TableHead>
                        <TableHead
                          className="text-base font-bold text-gray-700 w-5"
                          rowSpan={2}
                        >
                          Last Name
                        </TableHead>

                        {hosts.map((host: any) => (
                          <TableHead
                            key={host._id}
                            colSpan={2}
                            className="text-center text-base font-bold text-gray-700"
                          >
                            {host.user?.firstName ?? "Unknown"}
                          </TableHead>
                        ))}
                      </TableRow>

                      <TableRow className="border-gray-300 hover:bg-gray-200 transition-colors hover:bg-transparent">
                        {hosts.map((host) => (
                          <Fragment key={`${host._id}`}>
                            <TableHead
                              key={`${host._id}-t1`}
                              className="text-center text-base font-bold text-gray-700 w-5"
                            >
                              Tier 1
                            </TableHead>
                            <TableHead
                              key={`${host._id}-t2`}
                              className="text-center text-base font-bold text-gray-700 w-5"
                            >
                              Tier 2
                            </TableHead>
                          </Fragment>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {sortedUsersForHosts.map((u) => (
                        <TableRow
                          key={u._id}
                          className="border-b border-gray-300 opacity-90 hover:bg-gray-200 transition-colors"
                        >
                          <TableCell className="text-sm md:text-base font-semibold text-black">
                            {u.firstName}
                          </TableCell>
                          <TableCell className="text-sm md:text-base font-semibold text-black">
                            {u.lastName}
                          </TableCell>

                          {hosts.map((host: any) => {
                            const t1 = new Set(toIds(host.tier1));
                            const t2 = new Set(toIds(host.tier2));

                            return (
                              <Fragment key={`${host._id}-${u._id}`}>
                                <TableCell
                                  key={`${host._id}-${u._id}-t1`}
                                  className="text-center"
                                >
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-0"
                                    checked={t1.has(u._id)}
                                    onChange={(e) =>
                                      updateHostTier(
                                        host._id,
                                        u._id,
                                        "tier1",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell
                                  key={`${host._id}-${u._id}-t2`}
                                  className="text-center"
                                >
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-0"
                                    checked={t2.has(u._id)}
                                    onChange={(e) =>
                                      updateHostTier(
                                        host._id,
                                        u._id,
                                        "tier2",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                </TableCell>
                              </Fragment>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          {selectedSection === "emails" && (
            <div className="space-y-6">
              {/* ── Event Email Status ───────────────────────────── */}
              <Card className="bg-white border-gray-300">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-7 h-7 text-[#cc2616]" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Event Email Status
                        </h2>
                        <p className="text-sm text-gray-500">
                          Scheduled email status for all active events
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {emailLogsLoading ? (
                    <p className="text-sm text-gray-500 py-4">Loading...</p>
                  ) : emailEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">
                      No active events found.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="hover:bg-none">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="min-w-[180px]">
                              Event
                            </TableHead>
                            <TableHead className="text-center">
                              Tier 1
                            </TableHead>
                            <TableHead className="text-center">
                              Tier 2
                            </TableHead>
                            <TableHead className="text-center">
                              General
                            </TableHead>
                            <TableHead className="text-center">
                              Reminder
                            </TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emailEvents.map((event) => {
                            const fmt = (d?: string) =>
                              d
                                ? new Date(d).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    timeZone: "America/Los_Angeles",
                                  })
                                : null;

                            const StatusCell = ({
                              date,
                              sent,
                            }: {
                              date?: string;
                              sent?: boolean;
                            }) => {
                              if (!date)
                                return (
                                  <TableCell className="text-center text-gray-300 text-sm">
                                    —
                                  </TableCell>
                                );
                              const isPast = new Date(date) < new Date();
                              return (
                                <TableCell className="text-center">
                                  {sent ? (
                                    <span className="inline-flex flex-col items-center gap-0.5">
                                      <Check className="w-4 h-4 text-green-600" />
                                      <span className="text-[10px] text-green-600 font-medium">
                                        {fmt(date)}
                                      </span>
                                    </span>
                                  ) : isPast ? (
                                    <span className="inline-flex flex-col items-center gap-0.5">
                                      <X className="w-4 h-4 text-red-500" />
                                      <span className="text-[10px] text-red-500 font-medium">
                                        {fmt(date)}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex flex-col items-center gap-0.5">
                                      <span className="text-[11px] text-amber-600 font-medium">
                                        {fmt(date)}
                                      </span>
                                    </span>
                                  )}
                                </TableCell>
                              );
                            };

                            const now = new Date();
                            const hasMissed = [
                              { date: event.announcementTier1At, sent: event.announcementTier1Sent },
                              { date: event.announcementTier2At, sent: event.announcementTier2Sent },
                              { date: event.announcementPostAt,  sent: event.announcementPostSent  },
                              { date: event.reminderAt,          sent: event.reminderSent          },
                            ].some(({ date, sent }) => date && !sent && new Date(date) < now);
                            const isSeen = seenEventIds.has(event._id);
                            const highlightRow = hasMissed && !isSeen;

                            return (
                              <TableRow
                                key={event._id}
                                className={`transition-colors ${
                                  highlightRow
                                    ? "bg-red-50/60 hover:bg-red-50"
                                    : "hover:bg-green-50"
                                }`}
                              >
                                <TableCell>
                                  <p className="font-medium text-sm text-gray-900">
                                    {event.title}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDateInPST(event.dateTime)}
                                  </p>
                                </TableCell>
                                <StatusCell
                                  date={event.announcementTier1At}
                                  sent={event.announcementTier1Sent}
                                />
                                <StatusCell
                                  date={event.announcementTier2At}
                                  sent={event.announcementTier2Sent}
                                />
                                <StatusCell
                                  date={event.announcementPostAt}
                                  sent={event.announcementPostSent}
                                />
                                <StatusCell
                                  date={event.reminderAt}
                                  sent={event.reminderSent}
                                />
                                <TableCell>
                                  <button
                                    onClick={() => {
                                      setEventScheduleModal(event);
                                      setSeenEventIds((prev) => {
                                        const next = new Set(prev).add(event._id);
                                        persistSeenEventIds(next);
                                        return next;
                                      });
                                    }}
                                    className="text-xs text-[#14532d] underline hover:text-[#166534] whitespace-nowrap"
                                  >
                                    Details
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Cron Run History ─────────────────────────────── */}
              <Card className="bg-white border-gray-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-7 h-7 text-[#cc2616]" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Cron Run History
                      </h2>
                      <p className="text-sm text-gray-500">
                        Last 14 days — one row per day, gaps shown explicitly
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {emailLogsLoading ? (
                    <p className="text-sm text-gray-500 py-4">Loading...</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(() => {
                        // Build a Pacific-date string for each of the last 14 days
                        const pacificDate = (d: Date) =>
                          d.toLocaleDateString("en-CA", {
                            timeZone: "America/Los_Angeles",
                          });
                        const dayLabel = (iso: string) => {
                          // iso = "YYYY-MM-DD"
                          const [y, m, d] = iso.split("-").map(Number);
                          return new Date(y, m - 1, d).toLocaleDateString(
                            "en-US",
                            { weekday: "short", month: "short", day: "numeric", year: "numeric" },
                          );
                        };

                        const days: string[] = [];
                        for (let i = 0; i < 14; i++) {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          days.push(pacificDate(d));
                        }

                        // Group logs by Pacific date (multiple runs can share a day)
                        const logsByDay = new Map<string, EmailLog[]>();
                        for (const log of emailLogs) {
                          const key = pacificDate(new Date(log.runAt));
                          if (!logsByDay.has(key)) logsByDay.set(key, []);
                          logsByDay.get(key)!.push(log);
                        }

                        return days.map((iso) => {
                          const logsForDay = logsByDay.get(iso) ?? [];
                          const isToday = iso === pacificDate(new Date());
                          const label = isToday ? `Today · ${dayLabel(iso)}` : dayLabel(iso);

                          if (logsForDay.length === 0) {
                            return null;
                          }

                          // One or more runs for this day
                          return (
                            <div key={iso} className="space-y-1">
                              {logsForDay.map((log) => {
                                const isExpanded = expandedLog === log._id;
                                const runAtDate = new Date(log.runAt);
                                const runTime = runAtDate.toLocaleTimeString(
                                  "en-US",
                                  {
                                    timeZone: "America/Los_Angeles",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                );
                                const runTz =
                                  new Intl.DateTimeFormat("en-US", {
                                    timeZone: "America/Los_Angeles",
                                    timeZoneName: "short",
                                    hour: "numeric",
                                  })
                                    .formatToParts(runAtDate)
                                    .find((p) => p.type === "timeZoneName")
                                    ?.value ?? "PT";

                                const triggerLabel =
                                  log.triggeredBy === "github-cron"
                                    ? "Github Cron"
                                    : log.triggeredBy === "watchdog-cron"
                                      ? "Watchdog"
                                      : "Manual";
                                const triggerStyle =
                                  log.triggeredBy === "github-cron"
                                    ? "bg-green-100 text-green-800"
                                    : log.triggeredBy === "watchdog-cron"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-amber-100 text-amber-700";

                                return (
                                  <div
                                    key={log._id}
                                    className="border border-gray-200 rounded-lg overflow-hidden"
                                  >
                                    <div className="flex items-center w-full">
                                      <button
                                        onClick={() =>
                                          setExpandedLog(
                                            isExpanded ? null : log._id,
                                          )
                                        }
                                        className="flex-1 flex items-center justify-between px-4 py-2.5 text-left hover:bg-green-50 transition-colors min-w-0"
                                      >
                                        <div className="flex items-center gap-3 flex-wrap min-w-0">
                                          {log.success ? (
                                            <Check className="w-4 h-4 text-green-600 shrink-0" />
                                          ) : (
                                            <X className="w-4 h-4 text-red-500 shrink-0" />
                                          )}
                                          <span className="text-sm font-medium text-gray-800">
                                            {label}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            {runTime} {runTz}
                                          </span>
                                          <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${triggerStyle}`}
                                          >
                                            {triggerLabel}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {log.emailsSent} email
                                            {log.emailsSent !== 1 ? "s" : ""}{" "}
                                            sent ·{" "}
                                            {log.eventsProcessed} event
                                            {log.eventsProcessed !== 1
                                              ? "s"
                                              : ""}{" "}
                                            processed
                                          </span>
                                        </div>
                                        <span className="text-gray-400 text-sm ml-2 shrink-0">
                                          {isExpanded ? "▲" : "▼"}
                                        </span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLog(log._id)}
                                        disabled={deletingLogId === log._id}
                                        className="shrink-0 px-3 py-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors border-l border-gray-100"
                                        title="Delete log"
                                      >
                                        {deletingLogId === log._id ? (
                                          <span className="text-xs text-gray-400">…</span>
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>

                                    {isExpanded && (
                                      <div className="px-4 pb-4 pt-1 border-t border-green-100 bg-green-50/40">
                                        {log.error && (
                                          <p className="text-sm text-red-600 mb-2 font-medium">
                                            Error: {log.error}
                                          </p>
                                        )}
                                        {log.details.length === 0 ? (
                                          <p className="text-sm text-gray-400">
                                            No emails were sent in this run.
                                          </p>
                                        ) : (
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="text-left text-xs text-[#14532d] border-b border-green-200">
                                                <th className="pb-1 font-medium">
                                                  Event
                                                </th>
                                                <th className="pb-1 font-medium">
                                                  Type
                                                </th>
                                                <th className="pb-1 font-medium text-right">
                                                  Sent
                                                </th>
                                                <th className="pb-1"></th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {log.details.map((d, i) => (
                                                <tr
                                                  key={i}
                                                  className="border-b border-green-100 last:border-0 hover:bg-green-100/50 transition-colors"
                                                >
                                                  <td className="py-1.5 text-gray-700">
                                                    {d.eventTitle}
                                                  </td>
                                                  <td className="py-1.5 text-gray-500">
                                                    {d.type}
                                                  </td>
                                                  <td className="py-1.5 text-right font-medium text-[#14532d]">
                                                    {d.emailsSent}
                                                  </td>
                                                  <td className="py-1.5 pl-3">
                                                    {d.recipients &&
                                                      d.recipients.length >
                                                        0 && (
                                                        <button
                                                          onClick={() =>
                                                            setRecipientModal({
                                                              detail: d,
                                                            })
                                                          }
                                                          className="text-xs text-[#14532d] underline hover:text-[#166534] whitespace-nowrap"
                                                        >
                                                          View
                                                        </button>
                                                      )}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {selectedSection === "registrations" && (
            <Card className="bg-white border-gray-300">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <ArrowUpDown className="w-7 h-7 text-[#cc2616]" />
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Registration Log
                        </h2>
                        <p className="text-sm text-gray-500">
                          Register, unregister, waitlist, and admin seat changes.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={fetchRegistrationLogs}
                      variant="outline"
                      className="border-gray-300 text-black hover:bg-gray-50"
                      disabled={registrationLogsLoading}
                    >
                      {registrationLogsLoading ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-semibold text-gray-700">
                      Total: {registrationLogSummary.total}
                    </span>
                    <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 font-semibold text-green-800">
                      Registered: {registrationLogSummary.registered}
                    </span>
                    <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 font-semibold text-amber-800">
                      Waitlisted: {registrationLogSummary.waitlisted}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      Unregistered: {registrationLogSummary.unregistered}
                    </span>
                    {registrationLogSummary.latest && (
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-semibold text-blue-800">
                        Latest: {registrationLogSummary.latest}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setRegistrationLogEventId("");
                        setRegistrationLogUserId("");
                        setRegistrationLogAction("");
                        setTimeout(() => fetchRegistrationLogs(), 0);
                      }}
                      className="h-7 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      Clear filters
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      value={registrationLogEventId}
                      onChange={(e) => setRegistrationLogEventId(e.target.value)}
                      placeholder="Filter by event ID"
                      className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#2a558c]"
                    />
                    <input
                      value={registrationLogUserId}
                      onChange={(e) => setRegistrationLogUserId(e.target.value)}
                      placeholder="Filter by user ID"
                      className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#2a558c]"
                    />
                    <select
                      value={registrationLogAction}
                      onChange={(e) => setRegistrationLogAction(e.target.value)}
                      className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#2a558c] bg-white"
                    >
                      <option value="">All actions</option>
                      <option value="REGISTERED">Registered</option>
                      <option value="UNREGISTERED">Unregistered</option>
                      <option value="WAITLISTED">Waitlisted</option>
                      <option value="WAITLIST_LEFT">Left waitlist</option>
                      <option value="PROMOTED_FROM_WAITLIST">Promoted from waitlist</option>
                      <option value="ADMIN_REGISTERED">Admin registered</option>
                      <option value="ADMIN_UNREGISTERED">Admin unregistered</option>
                      <option value="ADMIN_WAITLISTED">Admin waitlisted</option>
                      <option value="ADMIN_PROMOTED_FROM_WAITLIST">Admin promoted</option>
                      <option value="ADMIN_REMOVED_FROM_WAITLIST">Admin removed from waitlist</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">
                    Filters use exact IDs. The action dropdown covers the common registration states we log.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {registrationLogsLoading ? (
                  <div className="py-16 text-center text-gray-500">
                    Loading registration logs...
                  </div>
                ) : registrationLogs.length === 0 ? (
                  <div className="py-16 text-center text-gray-500">
                    No registration logs found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[170px]">Time</TableHead>
                          <TableHead className="min-w-[160px]">Action</TableHead>
                          <TableHead className="min-w-[220px]">Player</TableHead>
                          <TableHead className="min-w-[220px]">Event</TableHead>
                          <TableHead className="min-w-[180px]">Actor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrationLogs.map((log) => (
                          <TableRow key={log._id}>
                            <TableCell className="align-top text-sm text-gray-700">
                              {formatDateInPST(log.createdAt)}
                            </TableCell>
                            <TableCell className="align-top">
                              <span className="inline-flex rounded-full bg-[#f3f7ef] px-2.5 py-1 text-xs font-bold text-[#14532d]">
                                {log.action}
                              </span>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="text-sm font-semibold text-black">
                                {log.userFirstName} {log.userLastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.userEmail}
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="text-sm font-semibold text-black">
                                {log.eventTitle}
                              </div>
                              {typeof log.event !== "string" && log.event.location && (
                                <div className="text-xs text-gray-500">
                                  {log.event.location}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="align-top text-sm text-gray-700">
                              {log.actorEmail || "System"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Photos ─────────────────────────────────────────────────────── */}
          {selectedSection === "photos" && (
            <Card className="bg-white border-gray-300">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Camera className="w-7 h-7 text-[#cc2616]" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Photo Management</h2>
                      <p className="text-sm text-gray-500">Review, approve, and manage member-uploaded photos</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(["PENDING", "APPROVED", "REJECTED", "ALL"] as FilterStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => setPhotoFilter(status)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                          photoFilter === status
                            ? "bg-[#2a558c] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                        }`}
                      >
                        {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                        {status === "PENDING" && photoFilter === "PENDING" && photos.length > 0 && (
                          <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">{photos.length}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {photosLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc2616] mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading photos...</p>
                    </div>
                  </div>
                ) : photos.length === 0 ? (
                  <div className="flex items-center justify-center h-48">
                    <p className="text-gray-400 text-base">
                      No {photoFilter !== "ALL" ? photoFilter.toLowerCase() : ""} photos found.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div key={photo._id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <div
                          className="relative aspect-[4/3] cursor-pointer"
                          onClick={() => setLightboxPhoto(photo)}
                        >
                          <Image
                            src={photo.cloudinaryUrl}
                            alt={photo.caption || photo.originalName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                          <div className="absolute top-2 right-2">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${photoStatusColors[photo.approvalStatus]}`}>
                              {photo.approvalStatus}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5">
                          {editingCaption === photo._id ? (
                            <div className="flex gap-1.5 mb-2">
                              <input
                                type="text"
                                value={captionText}
                                onChange={(e) => setCaptionText(e.target.value)}
                                maxLength={500}
                                placeholder="Add a caption..."
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#2a558c]"
                                autoFocus
                              />
                              <button onClick={() => handleSaveCaption(photo._id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingCaption(null)} className="p-1 text-gray-500 hover:bg-gray-50 rounded">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-1.5 mb-2">
                              <p className="text-xs text-gray-700 flex-1 line-clamp-1">
                                {photo.caption || <span className="text-gray-400 italic">No caption</span>}
                              </p>
                              <button onClick={() => startEditCaption(photo)} className="p-0.5 text-gray-400 hover:text-gray-600" title="Edit caption">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <div className="text-[11px] text-gray-500 space-y-0.5 mb-2.5">
                            <p>By <span className="font-medium text-gray-700">{photo.uploadedBy.firstName} {photo.uploadedBy.lastName}</span></p>
                            <p>
                              {new Date(photo.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              {" · "}{formatFileSize(photo.fileSize)}
                            </p>
                            {photo.approvedBy && (
                              <p>Approved by {photo.approvedBy.firstName} {photo.approvedBy.lastName}</p>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            {photo.approvalStatus === "PENDING" && (
                              <>
                                <button onClick={() => handleApprovePhoto(photo._id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors">
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button onClick={() => handleRejectPhoto(photo._id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors">
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            )}
                            {photo.approvalStatus === "REJECTED" && (
                              <button onClick={() => handleApprovePhoto(photo._id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors">
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}
                            <button onClick={() => handleDeletePhoto(photo._id)} className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded hover:bg-gray-300 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* ─────────────────────────────────────────────────────────────── */}
        </div>
      </div>

      {/* Event Schedule Modal */}
      {eventScheduleModal &&
        (() => {
          const ev = eventScheduleModal;

          const getPacificTzAbbr = (d: Date) =>
            new Intl.DateTimeFormat("en-US", {
              timeZone: "America/Los_Angeles",
              timeZoneName: "short",
              hour: "numeric",
            })
              .formatToParts(d)
              .find((p) => p.type === "timeZoneName")?.value ?? "PT";

          const fmtDateTime = (d?: string) => {
            if (!d) return null;
            const date = new Date(d);
            const tz = getPacificTzAbbr(date);
            return (
              date.toLocaleString("en-US", {
                timeZone: "America/Los_Angeles",
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }) +
              " " +
              tz
            );
          };

          // Cron fires at 6am Pacific on the scheduled date
          const expectedCronRun = (d?: string) => {
            if (!d) return null;
            const date = new Date(d);
            const day = date.toLocaleDateString("en-US", {
              timeZone: "America/Los_Angeles",
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const tz = getPacificTzAbbr(date);
            return `${day} at 6:00 AM ${tz}`;
          };

          const rows: {
            label: string;
            subject: string;
            date?: string;
            sent?: boolean;
          }[] = [
            {
              label: "Tier 1 Announcement",
              subject: `New Event Announcement: ${ev.title}`,
              date: ev.announcementTier1At,
              sent: ev.announcementTier1Sent,
            },
            {
              label: "Tier 2 Announcement",
              subject: `New Event Announcement: ${ev.title}`,
              date: ev.announcementTier2At,
              sent: ev.announcementTier2Sent,
            },
            {
              label: "General Announcement",
              subject: `New Event Announcement: ${ev.title}`,
              date: ev.announcementPostAt,
              sent: ev.announcementPostSent,
            },
            {
              label: "Reminder",
              subject: `Reminder: ${ev.title}`,
              date: ev.reminderAt,
              sent: ev.reminderSent,
            },
          ];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
                <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      Email Schedule
                    </p>
                    <p className="text-base font-semibold text-gray-900 mt-0.5">
                      {ev.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateInPST(ev.dateTime)}
                    </p>
                  </div>
                  <button
                    onClick={() => setEventScheduleModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 ml-4"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                  {rows.map((row) => {
                    const isPast = row.date
                      ? new Date(row.date) < new Date()
                      : false;
                    const status = !row.date
                      ? "not-set"
                      : row.sent
                        ? "sent"
                        : isPast
                          ? "missed"
                          : "upcoming";
                    return (
                      <div
                        key={row.label}
                        className={`rounded-lg p-3 border ${
                          status === "sent"
                            ? "border-green-200 bg-green-50/50"
                            : status === "missed"
                              ? "border-red-200 bg-red-50/50"
                              : status === "upcoming"
                                ? "border-amber-200 bg-amber-50/50"
                                : "border-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-800">
                            {row.label}
                          </p>
                          {status === "sent" && (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> Sent
                            </span>
                          )}
                          {status === "missed" && (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              <X className="w-3 h-3" /> Missed
                            </span>
                          )}
                          {status === "upcoming" && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Upcoming
                            </span>
                          )}
                          {status === "not-set" && (
                            <span className="text-xs text-gray-400 italic">
                              Not scheduled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          Subject:{" "}
                          <span className="text-gray-700">{row.subject}</span>
                        </p>
                        {row.date ? (
                          <>
                            <p className="text-xs text-gray-500">
                              Scheduled:{" "}
                              <span className="text-gray-700">
                                {fmtDateTime(row.date)}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Expected cron run:{" "}
                              <span className="text-gray-700">
                                {expectedCronRun(row.date)}
                              </span>
                            </p>
                            {status === "missed" && (
                              <div className="mt-2 pt-2 border-t border-red-100">
                                <p className="text-xs text-red-600 mb-2">
                                  The cron did not send this email on the
                                  expected date — likely a GitHub Actions miss.
                                  Running the cron now will send any outstanding
                                  emails for today.
                                </p>
                                <Button
                                  onClick={() => {
                                    setEventScheduleModal(null);
                                    handleRunCron();
                                  }}
                                  disabled={runningCron}
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-3"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  {runningCron ? "Running…" : "Run Cron Now"}
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            No date set for this email type.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

      {/* Recipient Detail Modal */}
      {recipientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  {recipientModal.detail.type}
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  Subject:{" "}
                  <span className="font-normal">
                    {recipientModal.detail.subject || "—"}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setRecipientModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3">
              <p className="text-xs text-gray-400 mb-3">
                {recipientModal.detail.recipients?.length} recipient(s)
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {recipientModal.detail.recipients?.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-2 text-gray-700">{r.name || "—"}</td>
                      <td className="py-2 text-gray-500">{r.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Phone Edit Modal */}
      <EditPhoneModal
        isOpen={editPhoneModal.isOpen}
        onClose={() =>
          setEditPhoneModal({
            isOpen: false,
            userId: "",
            currentPhone: "",
            currentFirstName: "",
            currentLastName: "",
            currentEmail: "",
            currentNotes: "",
            currentRole: "MEMBER",
          })
        }
        userId={editPhoneModal.userId}
        currentPhone={editPhoneModal.currentPhone}
        currentFirstName={editPhoneModal.currentFirstName}
        currentLastName={editPhoneModal.currentLastName}
        currentEmail={editPhoneModal.currentEmail}
        currentNotes={editPhoneModal.currentNotes}
        currentRole={editPhoneModal.currentRole}
        onUpdate={handlePhoneUpdate}
      />

      {/* Delete Event Modal */}
      <DeleteEventModal
        isOpen={deleteEventModal.isOpen}
        onClose={() =>
          setDeleteEventModal({ isOpen: false, eventId: "", eventTitle: "" })
        }
        eventTitle={deleteEventModal.eventTitle}
        onConfirm={handleConfirmDelete}
        isLoading={false}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={deleteUserModal.isOpen}
        onClose={() =>
          setDeleteUserModal({
            isOpen: false,
            userId: "",
            userName: "",
            userEmail: "",
          })
        }
        userName={deleteUserModal.userName}
        userEmail={deleteUserModal.userEmail}
        onConfirm={handleConfirmDeleteUser}
        isLoading={false}
      />

      {/* Photo lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxPhoto(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              <X className="w-8 h-8" />
            </button>
            <div className="relative w-full h-[80vh]">
              <Image
                src={lightboxPhoto.cloudinaryUrl}
                alt={lightboxPhoto.caption || "Photo"}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
