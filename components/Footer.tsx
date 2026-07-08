"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { useState } from "react";

export function Footer() {
  const [showColorBlindTest, setShowColorBlindTest] = useState(false);
  
  return (
    <>
      <Dialog open={showColorBlindTest} onOpenChange={setShowColorBlindTest}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Color Blind Test</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <iframe 
              width="620" 
              height="415" 
              src="https://www.youtube.com/embed/ZzUsKizhb8o?si=vL_7XlA3dD5UIb22" 
              title="YouTube video player" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-green-900 text-[#f8f6ed]">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-evenly px-14 lg:px-32 h-20">
              <Link
                href="/terms-of-service"
                className="text-[14px] leading-normal hover:text-white transition-colors duration-200 hover:underline"
              >
                Terms of Service
              </Link>
              <Link
                href="/participation-agreement"
                className="text-[14px] leading-normal hover:text-white transition-colors duration-200 hover:underline"
              >
                Participation Agreement
              </Link>
              <Link
                href="#"
                onClick={() => setShowColorBlindTest(true)}
                className="text-[14px] leading-normal hover:text-white transition-colors duration-200 hover:underline"
              >
                Color Blind Test
              </Link>
                            <p className="text-[14px] leading-normal">
                © 2026 Tournament of Champions. All rights reserved.
              </p>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden flex-col items-center px-4 py-2 gap-1">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/terms-of-service" className="text-[12px] hover:text-white hover:underline">Terms</Link>
            <span className="text-[10px] opacity-50">·</span>
            <Link href="/participation-agreement" className="text-[12px] hover:text-white hover:underline">Agreement</Link>
            <span className="text-[10px] opacity-50">·</span>
            <Link href="#" onClick={() => setShowColorBlindTest(true)} className="text-[12px] hover:text-white hover:underline">Color Test</Link>
            <span className="text-[10px] opacity-50">·</span>
            <Link
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[12px] hover:text-white hover:underline"
            >
              <img src="/assets/starbucks-cup.png" alt="" className="w-5 h-5" />
              Coffee
            </Link>
          </div>
          <p className="text-[10px] opacity-70">© 2026 Tournament of Champions</p>
        </div>
      </footer>
    </>
  );
}
