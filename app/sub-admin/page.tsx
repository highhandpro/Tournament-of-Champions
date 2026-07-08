"use client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDateInPST } from "@/lib/utils";
import { Archive, Calendar, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// ── Page component ────────────────────────────────────────────────────────────
const SubAdminPage = () => {
  const { data: session, status } = useSession();
  const user: any = session?.user;
  const [isSubAdmin, setIsSubAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!user?.email) {
      setIsSubAdmin(false);
      return;
    }
    fetch("/api/auth/check-admin")
      .then((res) => res.json())
      .then((data) => setIsSubAdmin(data.isSubAdmin === true))
      .catch(() => setIsSubAdmin(false));
  }, [status, user?.email]);

  if (isSubAdmin === false) notFound();

  const [activeTab, setActiveTab] = useState<"archived" | "tiers">("archived");

  // ── Archived events state ─────────────────────────────────────────
  const [eventsLoading, setEventsLoading] = useState(true);
  const [archivedEvents, setArchivedEvents] = useState<any[]>([]);

  const fetchArchivedEvents = async () => {
    try {
      setEventsLoading(true);
      const res = await api.getSubAdminArchivedEvents();
      setArchivedEvents(res.events || []);
    } catch (err) {
      console.error("Error fetching archived events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  // ── Host / tier management state ──────────────────────────────────
  const [hostLoading, setHostLoading] = useState(true);
  const [hostData, setHostData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [addressDraft, setAddressDraft] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  const sortedUsers = useMemo(
    () => [...allUsers].sort((a, b) => a.firstName.localeCompare(b.firstName)),
    [allUsers]
  );

  const tier1Ids = (hostData?.tier1 || []).map((x: any) =>
    typeof x === "string" ? x : x?._id
  );
  const tier2Ids = (hostData?.tier2 || []).map((x: any) =>
    typeof x === "string" ? x : x?._id
  );

  const fetchHost = async (showLoading = false) => {
    try {
      if (showLoading) setHostLoading(true);
      const data = await api.getHost(user?.id);
      setHostData(data);
    } catch (err) {
      console.error("Error fetching host data:", err);
    } finally {
      if (showLoading) setHostLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const usersData = await api.getUsersList();
      setAllUsers(usersData.users.map((u: any) => ({ ...u, id: u._id })));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const updateTier = async (
    userId: string,
    tier: "tier1" | "tier2",
    checked: boolean
  ) => {
    if (!hostData?._id) return;

    const cur1 = (hostData.tier1 || []).map((x: any) =>
      typeof x === "string" ? x : x?._id
    );
    const cur2 = (hostData.tier2 || []).map((x: any) =>
      typeof x === "string" ? x : x?._id
    );
    const addUnique = (arr: string[], id: string) =>
      Array.from(new Set([...arr, id]));
    const remove = (arr: string[], id: string) => arr.filter((x) => x !== id);

    let next1 = cur1;
    let next2 = cur2;

    if (tier === "tier1") {
      next1 = checked ? addUnique(cur1, userId) : remove(cur1, userId);
      if (checked) next2 = remove(cur2, userId);
    } else {
      next2 = checked ? addUnique(cur2, userId) : remove(cur2, userId);
      if (checked) next1 = remove(cur1, userId);
    }

    setHostData((prev: any) => ({ ...prev, tier1: next1, tier2: next2 }));

    try {
      await api.updateTierHost(hostData._id, next1, next2);
      await fetchHost();
    } catch (err) {
      console.error("updateTier failed:", err);
      await fetchHost();
    }
  };

  const saveAddress = async () => {
    if (!hostData?._id) return;
    try {
      setSavingAddress(true);
      await api.updateHostAddress(hostData._id, addressDraft);
      await fetchHost();
    } catch (e) {
      console.error("saveAddress failed:", e);
      await fetchHost();
    } finally {
      setSavingAddress(false);
    }
  };

  useEffect(() => {
    if (user && isSubAdmin) {
      fetchArchivedEvents();
      fetchHost(true);
      fetchAllUsers();
    }
  }, [user, isSubAdmin]);

  useEffect(() => {
    if (hostData?.address !== undefined) {
      setAddressDraft(hostData.address || "");
    }
  }, [hostData?.address]);

  // ── Shared background style ───────────────────────────────────────
  const pageStyle = {
    backgroundImage: "url('/assets/Faded-cards-background.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  if (eventsLoading || hostLoading) {
    return (
      <div className="min-h-screen" style={pageStyle}>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc2616] mx-auto mb-4" />
            <p className="text-black">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={pageStyle}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">

        {/* ── Tab buttons ───────────────────────────────────────── */}
        <div>
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-body">
            <li>
              <a
                className={
                  `flex gap-2 items-center justify-center p-4 font-semibold border-b-2 text-lg hover:cursor-pointer
                   ${activeTab === "archived" ? "text-[#14532d] border-[#14532d]" : "text-gray-500 border-transparent"}
                  `
                }
                onClick={() => setActiveTab("archived")}>
                <Archive className="w-6 h-6" />
                Archived Games
              </a>
            </li>
            <li>
              <a
                className={
                  `flex gap-2 items-center justify-center p-4 font-semibold border-b-2 text-lg hover:cursor-pointer
                   ${activeTab === "tiers" ? "text-[#14532d] border-[#14532d]" : "text-gray-500 border-transparent"}
                  `
                }
                onClick={() => setActiveTab("tiers")}>
                <Users className="w-6 h-6" />
                Manage Tiers
              </a>
            </li>
          </ul>
        </div>

        <div style={{ height: 20 }} />

        {/* ── Archived Games ─────────────────────────────────────── */}
        {activeTab === "archived" && (
          <section>
            {archivedEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <Archive className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                No archived games yet.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {archivedEvents.map((event, i) => (
                  <Link
                    key={event._id}
                    href={`/admin/archived-events/${event._id}`}
                    className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors ${
                      i < archivedEvents.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <Archive className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-black truncate">{event.title}</p>
                        <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateInPST(event.dateTime)}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="w-3.5 h-3.5" />
                            {event.registeredPlayers?.length ?? 0} player
                            {event.registeredPlayers?.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-4" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Manage Tiers ───────────────────────────────────────── */}
        {activeTab === "tiers" && hostData && (
          <section>
            <div className="bg-white rounded-lg shadow p-6">
              {/* Address */}
              <div className="flex flex-row items-end gap-6 mb-6">
                <div className="flex flex-col space-y-2 w-full">
                  <Label htmlFor="hostAddress" className="text-lg font-bold text-gray-700 tracking-wide">
                    Host Address
                  </Label>
                  <Input
                    id="hostAddress"
                    value={addressDraft}
                    onChange={(e) => setAddressDraft(e.target.value)}
                    className="w-full text-lg px-4 rounded-xl bg-gray-50 border border-gray-300 outline-none text-black"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveAddress}
                  disabled={savingAddress || addressDraft === (hostData?.address || "")}
                  className="h-10 px-6 rounded-xl bg-primary text-white disabled:opacity-50"
                >
                  {savingAddress ? "Saving..." : "Save"}
                </button>
              </div>

              {/* Tier table */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-300 hover:bg-gray-200 transition-colors">
                      <TableHead className="text-base font-bold text-gray-700 w-40">Tier 1</TableHead>
                      <TableHead className="text-base font-bold text-gray-700 w-40">Tier 2</TableHead>
                      <TableHead className="text-base font-bold text-gray-700 w-40">First Name</TableHead>
                      <TableHead className="text-base font-bold text-gray-700 w-40">Last Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((u) => (
                      <TableRow
                        key={u._id}
                        className="border-b border-gray-300 opacity-90 hover:bg-gray-200 transition-colors"
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-0"
                            checked={tier1Ids.includes(u._id)}
                            onChange={(e) => updateTier(u._id, "tier1", e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-0"
                            checked={tier2Ids.includes(u._id)}
                            onChange={(e) => updateTier(u._id, "tier2", e.target.checked)}
                          />
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-gray-600 font-medium">
                          {u.firstName}
                        </TableCell>
                        <TableCell className="text-sm md:text-base text-gray-600 font-medium">
                          {u.lastName}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default SubAdminPage;
