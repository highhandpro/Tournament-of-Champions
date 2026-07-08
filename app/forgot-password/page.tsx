"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { api } from "@/lib/api";

const ForgotPassword = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate email
      if (!email.trim()) {
        showErrorToast('Email is required');
        return;
      }

      // Basic email format validation
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email.trim())) {
        showErrorToast('Please enter a valid email address');
        return;
      }

      await api.forgotPassword(email.trim());
      
      showSuccessToast('Password reset link sent! Please check your email.');
      router.push('/login');
    } catch (error) {
      showErrorToast('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{
        backgroundImage: "url('/assets/Faded-cards-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
      <Navbar />


      {/* Center wrapper */}
      <main className="flex flex-1 items-center justify-center px-4 py-20">

        {/* Increased card size */}
        <Card className="w-full max-w-[520px] sm:max-w-[560px] md:max-w-[600px] bg-white border-border shadow-2xl py-6">
          
          {/* Header */}
          <CardHeader className="text-center space-y-4">
            <h1 className="font-display text-[38px] sm:text-[42px] md:text-[46px] font-extrabold text-black tracking-wide">
              Forgot Password
            </h1>
            <p className="text-black text-xl sm:text-2xl font-semibold tracking-wider">
              Enter your email to receive a reset link
            </p>
          </CardHeader>

          {/* Form Section */}
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Email Field */}
              <div className="space-y-3 min-w-0">
                <Label htmlFor="email" className="text-lg font-bold text-black tracking-wide">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-14 sm:h-16 text-lg sm:text-xl px-4 rounded-xl bg-white text-black border border-border outline-none focus:ring-2 ring-primary/40 truncate"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 sm:h-16 bg-[#cc2616] hover:bg-[#cc2616]/90 text-primary-foreground text-2xl font-extrabold py-3 rounded-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              {/* Back to login link */}
              <p className="text-center text-black text-lg font-semibold">
                Remember your password?{" "}
                <Link href="/login" className="text-[#cc2616] hover:underline font-bold">
                  Back to login
                </Link>
              </p>

            </form>
          </CardContent>

          {/* Card Footer */}
          <CardFooter className="justify-center pt-4">
            <p className="text-black text-base font-bold text-center text-lg">
              Need help? Contact Support
            </p>
          </CardFooter>

        </Card>
      </main>
     
    </div>
  );
};

export default ForgotPassword;