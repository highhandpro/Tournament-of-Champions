"use client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import {
  dismissToast,
  showErrorToast,
  showLoadingToast,
  showSuccessToast,
} from "@/lib/toast";
import { convertPSTToUTC, convertUTCToPST } from "@/lib/utils";
import { ArrowLeft, ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EditEvent = () => {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [hostList, setHostList] = useState<any[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [doNotAnnounce, setDoNotAnnounce] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [cardBgColor, setCardBgColor] = useState("#ebeaef");
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    hostId: "",
    announcementTier1Date: "",
    announcementTier2Date: "",
    announcementPostDate: "",
    reminderDate: "",
    maxPlayers: "",
    buyInMin: "",
    buyInMax: "",
    hospitalityFee: "",
    eventType: "NLHE",
    customEventType: "",
    blinds: "",
    gameTitle: "",
    gameDescription: "",
    gameRules: ["", "", ""],
    gameNote: "",
    details: "",
    details1: "",
    details2: "",
    details3: "",
    links: [{ label: "", url: "" }],
  });

  useEffect(() => {
    fetchEventData();
    const loadHosts = async () => {
      try {
        const res: any = await api.getAllHosts();
        setHostList(res.hosts || []);
      } catch (e) {
        setHostList([]);
      }
    };
    loadHosts();
  }, [eventId]);

  const toDateInputValue = (v: any) => {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      const response = await api.getEvent(eventId);
      const event = response.event || response;

      if (event.status === "ARCHIVED") {
        showErrorToast("Cannot edit archived events");
        router.push("/admin");
        return;
      }

      setEventData(event);
      setDoNotAnnounce(!!event.doNotAnnounce);
      setIsPrivate(!!event.isPrivate);
      if (event.cardBgColor) {
        setCardBgColor(event.cardBgColor);
      }
      if (event.bannerImageUrl) {
        setExistingBannerUrl(event.bannerImageUrl);
        setBannerPreview(event.bannerImageUrl);
      }
      let eventDate;
      let date, time;

      try {
        eventDate = new Date(event?.dateTime);

        if (isNaN(eventDate.getTime())) {
          throw new Error("Invalid date");
        }

        const pstDateTime = convertUTCToPST(event?.dateTime);
        date = pstDateTime.date;
        time = pstDateTime.time;
      } catch (dateError) {
        console.error(
          "Date parsing error:",
          dateError,
          "Raw dateTime:",
          event?.dateTime,
        );
        showErrorToast("Invalid event date/time format");
        router.push("/admin");
        return;
      }

      // Determine if it's a valid event type
      const validTypes = ["NLHE", "Mixed Games", "Tournament", "PLO"];
      const isValidType = validTypes.includes(event.eventType);

      setFormData({
        title: event.title || "",
        date: date || "",
        time: time || "",
        location: event.location || "",
        hostId: event.host?._id || event.host,
        announcementTier1Date: toDateInputValue(event.announcementTier1At),
        announcementTier2Date: toDateInputValue(event.announcementTier2At),
        announcementPostDate: toDateInputValue(event.announcementPostAt),
        reminderDate: toDateInputValue(event.reminderAt),
        maxPlayers: event.maxPlayers?.toString() || "",
        buyInMin: event.buyInMin?.toString() || "",
        buyInMax: event.buyInMax?.toString() || "",
        hospitalityFee:
          event.hospitalityFee !== undefined && event.hospitalityFee !== null
            ? event.hospitalityFee.toString()
            : "",
        eventType: isValidType ? event.eventType : "NLHE",
        customEventType: "",
        blinds: event.blinds || "",
        gameTitle: event.gameTitle || "No-Limit Hold'em & Bomb Pots*",
        gameDescription:
          event.gameDescription || "Double Board Omaha Hi/Hi Bomb Pot (Limit)",
        gameRules:
          event.gameRules?.length > 0
            ? event.gameRules
            : [
                "Classic double board format: two boards dealt per pot",
                "Limit betting structure throughout",
                "High hand wins on both boards; no split for low",
              ],
        gameNote: event.gameNote,
        details: event.details || "",
        details1: event.details1 || "",
        details2: event.details2 || "",
        details3: event.details3 || "",
        links:
          event.links && event.links.length > 0
            ? event.links
            : [{ label: "", url: "" }],
      });
    } catch (error: any) {
      console.error("Error fetching event data:", error);
      showErrorToast(error.message || "Failed to load event data");
      router.push("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value, name } = e.target;

    setFormData({ ...formData, [id]: value });
  };

  const handleGameRuleChange = (index: number, value: string) => {
    const newRules = [...formData.gameRules];
    newRules[index] = value;
    setFormData({ ...formData, gameRules: newRules });
  };

  const addGameRule = () => {
    setFormData({ ...formData, gameRules: [...formData.gameRules, ""] });
  };

  const removeGameRule = (index: number) => {
    const newRules = formData.gameRules.filter((_, i) => i !== index);
    setFormData({ ...formData, gameRules: newRules });
  };

  const handleLinkChange = (
    index: number,
    field: "label" | "url",
    value: string,
  ) => {
    const newLinks = [...formData.links];
    newLinks[index][field] = value;
    setFormData({ ...formData, links: newLinks });
  };
  const addLink = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { label: "", url: "" }],
    });
  };
  const removeLink = (index: number) => {
    const newLinks = formData.links.filter((_, i) => i !== index);
    setFormData({ ...formData, links: newLinks });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.date ||
      !formData.time ||
      !formData.location ||
      !formData.maxPlayers ||
      !formData.buyInMin ||
      !formData.buyInMax
    ) {
      showErrorToast("Please fill in all required fields");
      return;
    }
    const buyInMin = parseInt(formData.buyInMin);
    const buyInMax = parseInt(formData.buyInMax);
    const maxPlayers = parseInt(formData.maxPlayers);

    // Only validate buy-in fields if they are provided

    if (buyInMax < buyInMin) {
      showErrorToast(
        "Maximum buy-in must be greater than or equal to minimum buy-in",
      );
      return;
    }

    if (maxPlayers < 1 || maxPlayers > 100) {
      showErrorToast("Max players must be between 1 and 100");
      return;
    }

    setIsSaving(true);
    const loadingToast = showLoadingToast("Updating event...");

    try {
      // Convert PST date/time to UTC for storage
      // Admin enters time in PST, we convert to UTC
      const dateTime = new Date(convertPSTToUTC(formData.date, formData.time));
      const eventType = formData.eventType;

      // Filter out empty game rules
      const gameRules = formData.gameRules.filter((rule) => rule.trim() !== "");

      const updateData: any = {
        title: formData.title,
        doNotAnnounce,
        isPrivate,
        cardBgColor,
        dateTime: dateTime.toISOString(),
        location: formData.location,
        host: formData.hostId,
        announcementTier1At: formData.announcementTier1Date
          ? new Date(formData.announcementTier1Date + 'T12:00:00.000Z').toISOString()
          : undefined,
        announcementTier2At: formData.announcementTier2Date
          ? new Date(formData.announcementTier2Date + 'T12:00:00.000Z').toISOString()
          : undefined,
        announcementPostAt: formData.announcementPostDate
          ? new Date(formData.announcementPostDate + 'T12:00:00.000Z').toISOString()
          : undefined,
        reminderAt: formData.reminderDate
          ? new Date(formData.reminderDate + 'T12:00:00.000Z').toISOString()
          : undefined,
        maxPlayers,
        buyInMin,
        buyInMax,
        eventType: eventType,
        blinds: formData.blinds || "",
        gameTitle: formData.gameTitle || "",
        gameDescription: formData.gameDescription || "",
        gameRules: gameRules.length > 0 ? gameRules : [],
        gameNote: formData.gameNote || "",
      };

      // Include hospitality fee if provided
      if (formData.hospitalityFee) {
        updateData.hospitalityFee = parseFloat(formData.hospitalityFee);
      }

      // Include details if provided
      if (formData.details) {
        updateData.details = formData.details.trim();
      }

      updateData.details1 = formData?.details1?.trim();
      updateData.details2 = formData?.details2?.trim();
      updateData.details3 = formData?.details3?.trim();

      const validLinks = formData.links.filter(
        (link) => link.label.trim() && link.url.trim(),
      );
      updateData.links = validLinks;

      await api.updateEvent(eventId, updateData);

      // Handle banner image changes
      if (removeBanner && existingBannerUrl) {
        try {
          await api.deleteEventBanner(eventId);
        } catch (err) {
          console.error("Failed to delete banner:", err);
        }
      } else if (bannerFile) {
        try {
          await api.uploadEventBanner(eventId, bannerFile);
        } catch (err) {
          console.error("Failed to upload banner:", err);
        }
      }

      showSuccessToast("Event updated successfully!");
      router.push("/admin");
    } catch (error: any) {
      console.error("=== FRONTEND: Update failed ===", error);
      showErrorToast(error.message || "Failed to update event");
    } finally {
      setIsSaving(false);
      dismissToast(loadingToast);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen " style={{ backgroundColor: "#f8f6ed" }}>
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
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-14">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-black hover:text-black mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <Card className="bg-white border-border">
          <CardHeader className="text-center">
            <h1 className="font-display text-3xl font-bold  text-black">
              Edit Event
            </h1>
            <p className="text-muted-foreground mt-2 ">Update event details</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 btn-secondary  text-black"
                  onClick={() => router.push("/admin")}
                  disabled={isSaving}
                  style={{ backgroundColor: "#f8f6ed" }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 btn-secondary text-black"
                  onClick={() => router.push(`/events/${eventId}`)}
                  disabled={isSaving}
                  style={{ backgroundColor: "#f8f6ed" }}
                >
                  View Event
                </Button>
                <Button
                  type="submit"
                  className="flex-1 btn-primary text-white bg-[#cc2616] hover:bg-[#cc2616]/90"
                  disabled={isSaving}
                >
                  {isSaving ? "Updating..." : "Update Event"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-black">
                  Event Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black" htmlFor="location">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-black" htmlFor="hostId">
                  Host
                </Label>
                <select
                  id="hostId"
                  value={(formData as any).hostId}
                  onChange={handleChange}
                  className="w-full text-black h-10 px-3 py-2 bg-white border border-input rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select host</option>
                  {(hostList as any[]).map((h: any) => {
                    const u = h?.user;
                    const label = u
                      ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                      : h?._id;
                    return (
                      <option key={h._id} value={h._id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black" htmlFor="date">
                    Event Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="input-field text-black"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-black" htmlFor="time">
                    Time (PST)
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="input-field text-black"
                    required
                  />
                  <p className="text-sm text-gray-600">
                    Enter time in Pacific Standard Time (PST)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="doNotAnnounce"
                  type="checkbox"
                  checked={doNotAnnounce}
                  onChange={(e) => setDoNotAnnounce(e.target.checked)}
                  className="w-4 h-4 accent-[#cc2616] cursor-pointer"
                />
                <label htmlFor="doNotAnnounce" className="text-black text-sm cursor-pointer select-none">
                  Do not send announcements (reminder only)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 accent-[#cc2616] cursor-pointer"
                />
                <label htmlFor="isPrivate" className="text-black text-sm cursor-pointer select-none">
                  Private Event (Invitation Only)
                </label>
              </div>

              <div className="space-y-2">
                <Label className="text-black" htmlFor="cardBgColor">
                  Event Card Background Color
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    id="cardBgColor"
                    type="color"
                    value={cardBgColor}
                    onChange={(e) => setCardBgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <Input
                    type="text"
                    value={cardBgColor}
                    onChange={(e) => setCardBgColor(e.target.value)}
                    placeholder="#ebeaef"
                    className="w-32 text-black font-mono"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={() => setCardBgColor("#ebeaef")}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black" htmlFor="announcementTier1Date">
                    Announcement Date Tier 1
                  </Label>
                  <Input
                    id="announcementTier1Date"
                    type="date"
                    value={(formData as any).announcementTier1Date}
                    onChange={handleChange}
                    className="input-field text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black" htmlFor="announcementTier2Date">
                    Announcement Date Tier 2
                  </Label>
                  <Input
                    id="announcementTier2Date"
                    type="date"
                    value={(formData as any).announcementTier2Date}
                    onChange={handleChange}
                    className="input-field text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black" htmlFor="announcementPostDate">
                    Announcement Post Date
                  </Label>
                  <Input
                    id="announcementPostDate"
                    type="date"
                    value={(formData as any).announcementPostDate}
                    onChange={handleChange}
                    className="input-field text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black" htmlFor="reminderDate">
                    Reminder Date
                  </Label>
                  <Input
                    id="reminderDate"
                    type="date"
                    value={(formData as any).reminderDate}
                    onChange={handleChange}
                    className="input-field text-black"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-black" htmlFor="eventType">
                  Event Type
                </Label>
                <select
                  id="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full h-10 px-3 py-2 text-black border border-input rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="NLHE">NLHE</option>
                  <option value="Mixed Games">Mixed Games</option>
                  <option value="Tournament">Tournament</option>
                  <option value="PLO">PLO</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-black" htmlFor="maxPlayers">
                  Max Players
                </Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min="2"
                  max="50"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black" htmlFor="buyInMin">
                    Minimum Buy-in ($)
                  </Label>
                  <Input
                    id="buyInMin"
                    type="number"
                    min="0"
                    value={formData.buyInMin}
                    onChange={handleChange}
                    placeholder="100"
                    className="input-field text-black"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-black" htmlFor="buyInMax">
                    Maximum Buy-in ($)
                  </Label>
                  <Input
                    id="buyInMax"
                    type="number"
                    min="0"
                    value={formData.buyInMax}
                    onChange={handleChange}
                    placeholder="500"
                    className="input-field text-black"
                    required
                  />
                </div>
              </div>

              {/* <div className="space-y-2">
                <Label className="text-black" htmlFor="hospitalityFee">Hospitality Fee ($)</Label>
                <Input
                  id="hospitalityFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hospitalityFee}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                />
              </div> */}

              <div className="space-y-2">
                <Label className="text-black" htmlFor="blinds">
                  Blinds Structure
                </Label>
                <Input
                  id="blinds"
                  value={formData.blinds}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black" htmlFor="details1">
                  Details
                </Label>
                <Input
                  id="details1"
                  type="text"
                  value={formData.details1}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                />
                <Input
                  id="details2"
                  type="text"
                  value={formData.details2}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                />
                <Input
                  id="details3"
                  type="text"
                  value={formData.details3}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black">Event Links</Label>
                {formData.links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        handleLinkChange(index, "label", e.target.value)
                      }
                      placeholder="Link Label (e.g., Venue Details)"
                      className="input-field text-black flex-1"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) =>
                        handleLinkChange(index, "url", e.target.value)
                      }
                      placeholder="URL (e.g., https://example.com)"
                      className="input-field text-black flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeLink(index)}
                      className="text-black bg-white"
                      disabled={formData.links.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLink}
                  className="text-black bg-white"
                >
                  Add Link
                </Button>
              </div>

              {/* <div className="space-y-2">
                <Label className="text-black" htmlFor="gameTitle">Game Title</Label>
                <Input
                  id="gameTitle"
                  value={formData.gameTitle}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black" htmlFor="gameDescription">Game Description</Label>
                <Input
                  id="gameDescription"
                  value={formData.gameDescription}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black">Game Rules</Label>
                {formData.gameRules.map((rule, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={rule}
                      onChange={(e) => handleGameRuleChange(index, e.target.value)}
                      placeholder={`Rule ${index + 1}`}
                      className="input-field text-black"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGameRule(index)}
                      className="text-black bg-white"
                      disabled={formData.gameRules.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGameRule}
                  className="text-black bg-white"
                >
                  Add Rule
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-black" htmlFor="gameNote">Game Note</Label>
                <Input
                  id="gameNote"
                  value={formData.gameNote}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                />
              </div> */}

              {/* Banner Image */}
              <div className="space-y-2">
                <Label className="text-black">Banner Image</Label>
                {bannerPreview && !removeBanner ? (
                  <div className="relative rounded-md overflow-hidden border border-input">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full object-cover"
                      style={{ maxHeight: "180px" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                        if (existingBannerUrl) setRemoveBanner(true);
                      }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                      title="Remove banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      {removeBanner ? "Upload a new banner image" : "Click to upload banner image"}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">JPEG, PNG, or WebP · max 10 MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBannerFile(file);
                        setRemoveBanner(false);
                        const reader = new FileReader();
                        reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 btn-secondary  text-black"
                  onClick={() => router.push("/admin")}
                  disabled={isSaving}
                  style={{ backgroundColor: "#f8f6ed" }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 btn-secondary text-black"
                  onClick={() => router.push(`/events/${eventId}`)}
                  disabled={isSaving}
                  style={{ backgroundColor: "#f8f6ed" }}
                >
                  View Event
                </Button>
                <Button
                  type="submit"
                  className="flex-1 btn-primary text-white bg-[#cc2616] hover:bg-[#cc2616]/90"
                  disabled={isSaving}
                >
                  {isSaving ? "Updating..." : "Update Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditEvent;
