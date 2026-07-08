"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import { convertPSTToUTC } from "@/lib/utils";
import { ArrowLeft, ImageIcon, X } from "lucide-react";

const CreateEvent = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hostList, setHostList] = useState([]);
  const [doNotAnnounce, setDoNotAnnounce] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    maxPlayers: "",
    buyInMin: "",
    buyInMax: "",
    hospitalityFee: "",
    eventType: "NLHE",
    customEventType: "",
    blinds: "",
    details: "",
    details1: "",
    details2: "",
    details3: "",
    links: [{ label: "", url: "" }],
    hostId: "",
    announcementTier1Date: "",
    announcementTier2Date: "",
    announcementPostDate: "",
    reminderDate: "",
  });

  useEffect(() => {
    const loadHosts = async () => {
      try {
        const res: any = await api.getAllHosts();
        setHostList(res.hosts || []);
      } catch (e) {
        setHostList([]);
      }
    };
  
    loadHosts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, name } = e.target;
    
    if (id === "date") {
      const eventDateStr = value;
  
      const toDateInputValue = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };
  
      const addDays = (date: Date, days: number) => {
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        return next;
      };
  
      if (!eventDateStr) {
        setFormData({
          ...formData,
          date: "",
          announcementTier1Date: "",
          announcementTier2Date: "",
          announcementPostDate: "",
          reminderDate: "",
        });
        return;
      }
  
      const [y, m, d] = eventDateStr.split("-").map(Number);
      const eventDate = new Date(y, m - 1, d);
  
      const tier1Default = toDateInputValue(addDays(eventDate, -17));
      const tier2Default = toDateInputValue(addDays(eventDate, -15));
      const postDefault = toDateInputValue(addDays(eventDate, -14));
      const reminderDefault = toDateInputValue(addDays(eventDate, -1));
  
      setFormData((prev) => ({
        ...prev,
        date: eventDateStr,
        announcementTier1Date: tier1Default,
        announcementTier2Date: tier2Default,
        announcementPostDate: postDefault,
        reminderDate: reminderDefault,
      }));
      return;
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...formData.links];
    newLinks[index][field] = value;
    setFormData({ ...formData, links: newLinks });
  };
  const addLink = () => {
    setFormData({ ...formData, links: [...formData.links, { label: "", url: "" }] });
  };
  const removeLink = (index: number) => {
    const newLinks = formData.links.filter((_, i) => i !== index);
    setFormData({ ...formData, links: newLinks });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.time || !formData.location ||
      !formData.maxPlayers || !formData.buyInMin || !formData.buyInMax) {
      showErrorToast('Please fill in all required fields');
      return;
    }
    const buyInMin = parseInt(formData.buyInMin);
    const buyInMax = parseInt(formData.buyInMax);
    const maxPlayers = parseInt(formData.maxPlayers);

    if (buyInMax < buyInMin) {
      showErrorToast('Maximum buy-in must be greater than or equal to minimum buy-in');
      return;
    }
    if (maxPlayers < 1 || maxPlayers > 100) {
      showErrorToast('Max players must be between 1 and 100');
      return;
    }

    setIsLoading(true);
    const loadingToast = showLoadingToast('Creating event...');

    try {
      const dateTime = new Date(convertPSTToUTC(formData.date, formData.time));
      const eventType = formData.eventType;
      const eventData: any = {
        title: formData.title,
        doNotAnnounce,
        isPrivate,
        dateTime: dateTime.toISOString(),
        location: formData.location,
        host: formData.hostId,
        announcementTier1At: formData.announcementTier1Date ? new Date(formData.announcementTier1Date + 'T12:00:00.000Z').toISOString() : undefined,
        announcementTier2At: formData.announcementTier2Date ? new Date(formData.announcementTier2Date + 'T12:00:00.000Z').toISOString() : undefined,
        announcementPostAt: formData.announcementPostDate ? new Date(formData.announcementPostDate + 'T12:00:00.000Z').toISOString() : undefined,
        reminderAt: formData.reminderDate ? new Date(formData.reminderDate + 'T12:00:00.000Z').toISOString() : undefined,
        maxPlayers,
        buyInMin,
        buyInMax,
        eventType: eventType,
        blinds: formData.blinds || undefined,
      };

      if (formData.buyInMin && formData.buyInMax) {
        eventData.buyInMin = parseInt(formData.buyInMin);
        eventData.buyInMax = parseInt(formData.buyInMax);
      }
      if (formData.hospitalityFee) {
        eventData.hospitalityFee = parseFloat(formData.hospitalityFee);
      }
      if (formData.details) {
        eventData.details = formData.details.trim();
      }
      if (formData.details1) {
        eventData.details1 = formData.details1.trim();
      }
      if (formData.details2) {
        eventData.details2 = formData.details2.trim();
      }
      if (formData.details3) {
        eventData.details3 = formData.details3.trim();
      }

      const validLinks = formData.links.filter(link => link.label.trim() && link.url.trim());
      if (validLinks.length > 0) {
        eventData.links = validLinks;
      }

      const created = await api.createEvent(eventData);

      // Upload banner after event is created so we have its ID
      if (bannerFile && created?.event?._id) {
        await api.uploadEventBanner(created.event._id, bannerFile);
      }

      showSuccessToast('Event created successfully!');
      router.push("/admin");
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
      dismissToast(loadingToast);
    }
  };

  return (
    <div className="min-h-screen" style={{
      backgroundImage: "url('/assets/Faded-cards-background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <Navbar />



      <div className="max-w-2xl mx-auto px-4 pt-5 pb-14">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-black hover:text-black mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <Card className="bg-white border-gray-300 shadow-2xl">
          <CardHeader className="text-center">
            <h1 className="font-display text-3xl font-bold text-black">Create New Event</h1>
            <p className="text-muted-foreground mt-2">Add a new poker event to the calendar</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-black">Event Title</Label>
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
                <Label
                  className="text-black"
                  htmlFor="location"
                >
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
                <Label className="text-black" htmlFor="hostId">Host</Label>
                <select
                  id="hostId"
                  value={(formData as any).hostId}
                  onChange={handleChange}
                  className="w-full text-black h-10 px-3 py-2 bg-white border border-input rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select host</option>
                  {(hostList as any[]).map((h: any) => {
                    const u = h?.user;
                    const label = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : h?._id;
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
                  <Label className="text-black" htmlFor="date">Event Date</Label>
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
                  <Label className="text-black" htmlFor="time">Time (PST)</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="input-field text-black"
                    required
                  />
                  <p className="text-sm text-gray-600">Enter time in Pacific Standard Time (PST)</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black" htmlFor="announcementTier1Date">Announcement Date Tier 1</Label>
                  <Input
                    id="announcementTier1Date"
                    type="date"
                    value={(formData as any).announcementTier1Date}
                    onChange={handleChange}
                    className="input-field text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black" htmlFor="announcementTier2Date">Announcement Date Tier 2</Label>
                  <Input
                    id="announcementTier2Date"
                    type="date"
                    value={(formData as any).announcementTier2Date}
                    onChange={handleChange}
                    className="input-field text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black" htmlFor="announcementPostDate">Announcement Post Date</Label>
                  <Input
                    id="announcementPostDate"
                    type="date"
                    value={(formData as any).announcementPostDate}
                    onChange={handleChange}
                    className="input-field text-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black" htmlFor="reminderDate">Reminder Date</Label>
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
                <Label className="text-black" htmlFor="eventType">Event Type</Label>
                <select
                  id="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full text-black h-10 px-3 py-2 bg-white border border-input rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="NLHE">NLHE</option>
                  <option value="Mixed Games">Mixed Games</option>
                  <option value="Tournament">Tournament</option>
                  <option value="PLO">PLO</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-black" htmlFor="maxPlayers">Max Players</Label>
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
                  <Label className="text-black" htmlFor="buyInMin">Minimum Buy-in ($)</Label>
                  <Input
                    id="buyInMin"
                    type="number"
                    min="0"
                    value={formData.buyInMin}
                    onChange={handleChange}
                    placeholder=""
                    className="input-field text-black"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-black" htmlFor="buyInMax">Maximum Buy-in ($)</Label>
                  <Input
                    id="buyInMax"
                    type="number"
                    min="0"
                    value={formData.buyInMax}
                    onChange={handleChange}
                    placeholder=""
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
                <Label className="text-black" htmlFor="blinds">Blinds Structure</Label>
                <Input
                  id="blinds"
                  type="text"
                  value={formData.blinds}
                  onChange={handleChange}
                  placeholder=""
                  className="input-field text-black"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black" htmlFor="details1">Details</Label>
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
                      onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                      placeholder="Link Label (e.g., Venue Details)"
                      className="input-field text-black flex-1"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
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

              {/* Banner Image */}
              <div className="space-y-2">
                <Label className="text-black">Banner Image <span className="text-gray-400 font-normal">(optional)</span></Label>
                <p className="text-xs text-gray-500">Displayed as the event header. Recommended: landscape photo, min 1200 × 375 px.</p>
                {bannerPreview ? (
                  <div className="relative w-full rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                    <ImageIcon className="w-7 h-7 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload banner</span>
                    <span className="text-xs text-gray-400 mt-0.5">JPEG, PNG, or WebP · max 10 MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setBannerFile(file);
                        setBannerPreview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 btn-secondary text-black"
                  onClick={() => router.push("/admin")}
                  style={{ backgroundColor: '#f8f6ed' }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 btn-primary text-white bg-[#2a558c] hover:bg-[#2a558c]/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default CreateEvent;
