"use client";

import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { dismissToast, showErrorToast, showLoadingToast, showSuccessToast } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const Signup = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;

    // Auto-format phone number
    if (id === 'phone') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '');

      // Limit to 10 digits
      const limitedDigits = digitsOnly.slice(0, 10);

      // Format as (###) ###-####
      let formatted = limitedDigits;
      if (limitedDigits.length >= 6) {
        formatted = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
      } else if (limitedDigits.length >= 3) {
        formatted = `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
      } else if (limitedDigits.length > 0) {
        formatted = `(${limitedDigits}`;
      }

      setFormData((prev) => ({ ...prev, [id]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side validation
    if (!formData.firstName.trim()) {
      showErrorToast('First name is required');
      setIsLoading(false);
      return;
    }

    if (!formData.lastName.trim()) {
      showErrorToast('Last name is required');
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      showErrorToast('Email is required');
      setIsLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      showErrorToast('Password is required');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      showErrorToast('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      showErrorToast('Phone number is required');
      setIsLoading(false);
      return;
    }

    // Validate phone number format (must be 10 digits)
    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      showErrorToast('Phone number must be exactly 10 digits');
      setIsLoading(false);
      return;
    }

    const loadingToast = showLoadingToast('Creating your account...');

    try {
      await api.signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phone,
        notes: formData.notes.trim(),
        password: formData.password,
      });

      showSuccessToast('Account created successfully! Your membership is under review.');
      router.push('/membership-under-review');
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
      dismissToast(loadingToast);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{
      backgroundImage: "url('/assets/Faded-cards-background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <Navbar />



      {/* Centering + proper spacing */}
      <main className="flex flex-1 items-center justify-center px-4 py-5 pb-20">

        {/* Increased card width + height balanced */}
        <Card className="w-full max-w-[560px] sm:max-w-[600px] md:max-w-[640px] bg-white border-gray-300 shadow-2xl p-2 sm:p-4">

          {/* Header */}
          <CardHeader className="text-center space-y-4 pb-6">
            <h1 className="font-display text-xl sm:text-2xl md:text-4xl font-extrabold text-black tracking-wide">
              Join the Club
            </h1>
            <p className="text-gray-700 text-md sm:text-lg font-semibold tracking-wider">
              Create your membership account
            </p>
          </CardHeader>

          {/* Form */}
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

                {/* First Name */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="firstName" className="text-md font-bold text-gray-700 tracking-wide">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full h-10 sm:h-12 text-lg sm:text-xl px-4 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 ring-primary/40 truncate text-black"
                    required
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="lastName" className="text-md font-bold text-gray-700 tracking-wide">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder=""
                    className="w-full h-10 sm:h-12 text-lg sm:text-xl px-4 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 ring-primary/40 truncate text-black"
                    required
                  />
                </div>

              </div>

              {/* Email */}
              <div className="space-y-3 min-w-0">
                <Label htmlFor="email" className="text-md font-bold text-gray-700 tracking-wide">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full h-10 sm:h-12 text-lg sm:text-xl px-4 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 ring-primary/40 truncate text-black"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-3 min-w-0">
                <Label htmlFor="password" className="text-md font-bold text-gray-700 tracking-wide">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full h-10 sm:h-12 text-lg sm:text-xl px-4 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 ring-primary/40 truncate text-black"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-3 min-w-0">
                <Label htmlFor="phone" className="text-md font-bold text-gray-700 tracking-wide">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full h-10 sm:h-12 text-lg sm:text-xl px-4 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 ring-primary/40 truncate text-black"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-3 min-w-0">
                <Label htmlFor="notes" className="text-md font-bold text-gray-700 tracking-wide">
                  How did you hear about the club?
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full text-lg sm:text-xl px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 ring-primary/40 resize-none truncate text-black"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 sm:h-12 bg-[#cc2616] hover:bg-[#cc2616]/90 text-white text-lg font-extrabold py-3 rounded-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              {/* Bottom link */}
              <p className="text-center text-gray-700 text-lg font-semibold">
                Already have an account?{" "}
                <Link href="/login" className="hover:underline font-bold text-black">
                  Sign in
                </Link>
              </p>

            </form>
          </CardContent>

        </Card>
      </main>

    </div>
  );
};

export default Signup;
