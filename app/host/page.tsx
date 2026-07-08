"use client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

interface Host {
  _id: string;
  user: string;
  address: string;
  tier1: string[];
  tier2: string[];
}

const Host = () => {
  const [loading, setLoading] = useState(true);
  const [hostData, setHostData] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [addressDraft, setAddressDraft] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const { data: session } = useSession();
  const user: any = session?.user;

  const sortedUsersForHosts = useMemo(() => {
    return [...allUsers].sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [allUsers]);

  const tier1Ids = (hostData?.tier1 || []).map((x: any) => (typeof x === "string" ? x : x?._id));
  const tier2Ids = (hostData?.tier2 || []).map((x: any) => (typeof x === "string" ? x : x?._id));

  const fetchAllUsers = async () => {
    try {
      const usersData = await api.getUsersList();
      const mappedUsers = usersData.users.map((u: any) => ({
        ...u,
        id: u._id
      }));
      setAllUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  const fetchHost = async () => {
    try {
      setLoading(true);
      const hostData = await api.getHost(user?.id);
      setHostData(hostData);
    } catch (error) {
      console.error("Error fetching host data:", error);
    } finally {
      setLoading(false);
    }
  }

  const updateTier = async (
    userId: string,
    tier: "tier1" | "tier2",
    checked: boolean
  ) => {
    if (!hostData?._id) return;
  
    const currentTier1 = (hostData.tier1 || []).map((x: any) => typeof x === "string" ? x : x?._id);
    const currentTier2 = (hostData.tier2 || []).map((x: any) => typeof x === "string" ? x : x?._id);
    const addUnique = (arr: string[], id: string) => Array.from(new Set([...arr, id]));
    const removeId = (arr: string[], id: string) => arr.filter((x) => x !== id);
  
    let nextTier1 = currentTier1;
    let nextTier2 = currentTier2;
    
    if (tier === "tier1") {
      if (checked) {
        nextTier1 = addUnique(currentTier1, userId);
        nextTier2 = removeId(currentTier2, userId);
      } else {
        nextTier1 = removeId(currentTier1, userId);
      }
    }
    
    if (tier === "tier2") {
      if (checked) {
        nextTier2 = addUnique(currentTier2, userId);
        nextTier1 = removeId(currentTier1, userId);
      } else {
        nextTier2 = removeId(currentTier2, userId);
      }
    }
  
    setHostData((prev: any) => ({
      ...prev,
      tier1: nextTier1,
      tier2: nextTier2,
    }));
  
    try {
      await api.updateTierHost(hostData._id, nextTier1, nextTier2);
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
    if (user) {
      fetchHost();
      fetchAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (hostData?.address !== undefined) {
      setAddressDraft(hostData.address || "");
    }
  }, [hostData?.address]);

  if (loading) {
    return (
      <div className="min-h-screen " style={{
        backgroundImage: "url('/assets/Faded-cards-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc2616] mx-auto mb-4"></div>
            <p className="text-black">Loading host...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen " style={{
      backgroundImage: "url('/assets/Faded-cards-background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <Navbar />
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-16 lg:px-32 py-10 sm:py-14 pb-24">
        {hostData && (
          <div className="mb-12">
            <h2 className="font-display text-[22px] sm:text-[30px] md:text-[36px] font-semibold tracking-wide mb-6 text-black leading-tight">
              Host
            </h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-row items-end gap-6">
                <div className="flex flex-col space-y-2 w-full">
                  <Label htmlFor="title" className="text-lg font-bold text-gray-700 tracking-wide">Host Address</Label>
                  <Input
                    id="title"
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
              <Table className="mt-5">
                <TableHeader>
                  <TableRow className="border-gray-300 hover:bg-gray-200 transition-colors">
                    <TableHead className="text-base font-bold text-gray-700 w-40">Tier 1</TableHead>
                    <TableHead className="text-base font-bold text-gray-700 w-40">Tier 2</TableHead>
                    <TableHead className="text-base font-bold text-gray-700 w-40">First Name</TableHead>
                    <TableHead className="text-base font-bold text-gray-700 w-40">Last Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsersForHosts.map((user) => (
                    <TableRow key={user._id} className="border-b border-gray-300 opacity-90 hover:bg-gray-200 transition-colors">
                      <TableCell className="text-sm md:text-base font-semibold text-black">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-0"
                          checked={tier1Ids.includes(user._id)}
                          onChange={(e) => updateTier(user._id, "tier1", e.target.checked)} />
                      </TableCell>
                      <TableCell className="text-sm md:text-base text-gray-600 font-medium">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-0"
                          checked={tier2Ids.includes(user._id)}
                          onChange={(e) => updateTier(user._id, "tier2", e.target.checked)}/>
                      </TableCell>
                      <TableCell className="text-sm md:text-base text-gray-600 font-medium">
                        {user.firstName}
                      </TableCell>
                      <TableCell className="text-sm md:text-base text-gray-600 font-medium">
                        {user.lastName}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Host;