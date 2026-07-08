"use client";

import { Navbar } from "@/components/Navbar";
import { Suspense } from "react";
import LoginContent from "./LoginContent";

const Login = () => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: "url('/assets/Faded-cards-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <Suspense fallback={<div className="text-center text-black">Loading...</div>}>
          <LoginContent />
        </Suspense>
      </main>
    </div>
  );
};

export default Login;
