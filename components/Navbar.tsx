"use client";

import { cn } from "@/lib/utils";
import { Menu, User, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";


const navLinks = [
  { name: "Home", path: "/" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const { data: session, status } = useSession();
  const user = session?.user;
  const isClientReady = status !== "loading";

  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.email) {
        try {
          const response = await fetch('/api/auth/check-admin');
          const data = await response.json();
          setIsAdmin(data.isAdmin);
          setIsSubAdmin(data.isSubAdmin);
        } catch (error) {
          console.error('Error checking admin:', error);
        }
      }
    };

    if (isClientReady && user) {
      checkAdmin();
    }
  }, [isClientReady, user]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/";
  };

  const finalNavLinks = [
    ...navLinks,
    ...(isClientReady && user ? [{ name: "Events", path: "/events" }] : []),
    ...(isClientReady && user ? [{ name: "Photos", path: "/photos" }] : []),
    ...(isClientReady && user && isSubAdmin ? [{ name: "Sub-Admin", path: "/sub-admin" }] : []),
    ...(isClientReady && user && isAdmin ? [{ name: "Admin", path: "/admin" }] : []),
  ]

  return (
    <nav className="sticky top-0 z-50 bg-green-900 border-b border-border font-[arial]">
      <div className="w-full flex items-center justify-between px-4 md:px-14 lg:px-32 h-20">

        {/* LOGO */}
        <Link href="/" className="truncate">
          <span className="text-[#f8f6ed] font-medium tracking-wide text-[18px] sm:text-[22px] md:text-[22px] lg:text-[24px] leading-tight">
            Tournament of Champions
          </span>
        </Link>
        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-8">
          {finalNavLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={cn(
                "text-base font-normal tracking-wide",
                pathname === link.path
                  ? "text-[#f8f6ed] underline underline-offset-8"
                  : "text-[#f8f6ed] hover:text-white"
              )}>
              {link.name}
            </Link>
          ))}

          {isClientReady && (
            user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-[#f8f6ed] font-bold hover:text-white"
                >
                  <User className="w-5 h-5" />
                  {user.firstName}
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-[#f8f6ed] font-bold hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-[#f8f6ed] font-bold">
                <Link href="/login" className="hover:text-white">
                  Login
                </Link>
                <span>|</span>
                <Link href="/signup" className="hover:text-white">
                  Sign Up
                </Link>
              </div>
            )
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden text-[#f8f6ed]"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* ✅ MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-green-900 border-t border-border px-4 py-6 space-y-4">
          {finalNavLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block text-lg font-bold",
                pathname === link.path
                  ? "text-white underline underline-offset-8"
                  : "text-[#f8f6ed]"
              )}
            >
              {link.name}
            </Link>
          ))}

          <div className="border-t border-white/20 pt-4">
            {isClientReady && (
              user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-[#f8f6ed] font-bold mb-3"
                  >
                    <User className="w-5 h-5" />
                    {user.firstName}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-[#f8f6ed] font-bold"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-4 text-[#f8f6ed] font-bold">
                  <Link href="/login">Login</Link>
                  <Link href="/signup">Sign Up</Link>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
