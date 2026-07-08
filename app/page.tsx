"use client";

import { Navbar } from "@/components/Navbar";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const user: any = session?.user;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="h-screen"
      style={{
        backgroundImage: "url('/assets/toc-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="lg:hidden fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/assets/toc-bg-phone.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top 0px",
        }}
      />
      <div className="relative z-10 h-full flex flex-col">
        <Navbar />
        <section className="flex-1 flex items-start justify-center px-4">
          <div
            className="flex flex-col items-center text-center rounded-2xl px-10 py-10 md:px-16 md:py-12"
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          >
            <h1
              className="text-[28px] sm:text-[34px] md:text-[42px] lg:text-[50px] font-bold mb-2 leading-tight"
              style={{ color: "#D4AF37", fontFamily: "'Times New Roman', Times, serif", textShadow: "2px 3px 8px rgba(0,0,0,0.55)" }}
            >
              Play. Connect. Repeat.
            </h1>
            <p
              className="text-[15px] md:text-[18px] lg:text-[20px] mb-12 font-normal"
              style={{ color: "#F3F4F6", fontFamily: "'Times New Roman', Times, serif", textShadow: "1px 2px 6px rgba(0,0,0,0.45)" }}
            >
              Fun and Fellowship for Poker Enthusiasts
            </p>
            <Image
              className="w-[130px] h-[130px] md:w-[180px] md:h-[180px] mb-7"
              src="/logo.png"
              alt="Tournament of Champions — Poker Series"
              width={300}
              height={300}
            />
            <button
              onClick={() => {
                if (user) {
                  router.push("/events");
                } else {
                  router.push("/login");
                }
              }}
              className="inline-block px-7 py-3 bg-[#D4AF37] text-zinc-950 rounded-md text-sm md:text-base font-bold font-[Arial,sans-serif] hover:bg-[#C5A028] transition-colors">
              See All Events →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
