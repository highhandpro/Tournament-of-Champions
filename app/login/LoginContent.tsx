"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { LockKeyhole, User } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('Account not approved')) {
          showErrorToast('Your account is pending approval. Please wait for admin approval.');
        } else {
          showErrorToast('Invalid email or password');
        }
      } else if (result?.ok) {
        showSuccessToast('Welcome back! You have been logged in successfully.');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      showErrorToast('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[420px] sm:max-w-[460px] md:max-w-[500px] bg-white border-gray-300 shadow-2xl py-6">

      {/* Header */}
      <CardHeader className="flex items-center">
        <img src="/logo.png" alt="Tournament of Champions — Poker Series" className="max-w-[200px]" />
      </CardHeader>

      {/* Form Section */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-3 min-w-0">
            <Label htmlFor="email" className="text-md font-bold text-gray-700 tracking-wide">
              Email
            </Label>
            <Input
              icon={<User className="w-5 h-5 text-gray-700" />}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=""
              className="w-full h-10 sm:h-12 text-lg sm:text-xl px-4 rounded-xl bg-gray-50 border border-gray-300 outline-none focus:ring-2 ring-primary/40 truncate text-black"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-3 min-w-0">
            <Label htmlFor="password" className="text-md font-bold text-gray-700 tracking-wide">
              Password
            </Label>
            <Input
              icon={<LockKeyhole className="w-5 h-5 text-gray-700" />}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              className="w-full h-10 sm:h-12 text-lg sm:text-xl px-4 rounded-xl bg-gray-50 border border-gray-300 outline-none focus:ring-2 ring-primary/40 truncate text-black"
              required
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link href="/forgot-password" className="hover:underline font-bold text-sm text-black">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 sm:h-12 bg-[#295db0] hover:bg-[#295db0]/90 text-white text-md font-extrabold py-3 rounded-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          {/* Extra Footer Text */}
          <p className="text-center text-gray-700 text-lg font-semibold">
            Don't have an account?{" "}
            <Link
              href={`/signup${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
              className="hover:underline font-bold text-black"
            >
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>

    </Card>
  );
};

export default LoginContent;
