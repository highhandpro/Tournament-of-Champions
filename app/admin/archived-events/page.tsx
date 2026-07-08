// This file is intentionally left as a redirect.
// Individual archived events are viewed at /admin/archived-events/[id]
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArchivedEventsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin");
  }, [router]);
  return null;
}
