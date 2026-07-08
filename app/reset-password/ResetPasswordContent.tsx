"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { api } from "@/lib/api";

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    // Get token from URL
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      showErrorToast('Invalid reset link');
      router.push('/login');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validation
      if (!password.trim()) {
        showErrorToast('Password is required');
        return;
      }

      if (!confirmPassword.trim()) {
        showErrorToast('Please confirm your password');
        return;
      }

      if (password !== confirmPassword) {
        showErrorToast('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        showErrorToast('Password must be at least 6 characters long');
        return;
      }

      await api.resetPassword(token, password, confirmPassword);
      
      showSuccessToast('Password reset successfully! You can now log in with your new password.');
      router.push('/login');
    } catch (error) {
      showErrorToast('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null; // Loading state while checking token
  }

  return (
    <Card className="w-full max-w-[520px] sm:max-w-[560px] md:max-w-[600px] bg-white border-border shadow-2xl py-6">
      
      {/* Header */}
      <CardHeader className="text-center space-y-4">
        <h1 className="font-display text-[38px] sm:text-[42px] md:text-[46px] font-extrabold text-black tracking-wide">
          Set New Password
        </h1>
        <p className="text-black text-xl sm:text-2xl font-semibold tracking-wider">
          Create a new password for your account
        </p>
      </CardHeader>

      {/* Form Section */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* New Password Field */}
          <div className="space-y-3 min-w-0">
            <Label htmlFor="password" className="text-lg font-bold text-black tracking-wide">
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              className="w-full h-14 sm:h-16 text-black text-lg sm:text-xl px-4 rounded-xl bg-white border border-border outline-none focus:ring-2 ring-primary/40 truncate"
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-3 min-w-0">
            <Label htmlFor="confirmPassword" className="text-lg font-bold text-black tracking-wide">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=""
              className="w-full h-14 sm:h-16 text-lg sm:text-xl px-4 rounded-xl bg-white border border-border outline-none focus:ring-2 ring-primary/40 truncate text-black"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 sm:h-16 bg-[#cc2616] hover:bg-[#cc2616]/90 text-primary-foreground text-2xl font-extrabold py-3 rounded-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
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
  );
};

export default ResetPasswordContent;