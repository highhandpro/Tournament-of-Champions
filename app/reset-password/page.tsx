"use client";

import { Suspense } from "react";
import ResetPasswordContent from "./ResetPasswordContent";
import { Navbar } from "@/components/Navbar";

const ResetPassword = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col" style={{
      backgroundImage: "url('/assets/Faded-cards-background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>



      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </main>

    </div>
  );
};

export default ResetPassword;