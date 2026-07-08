"use client";

import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Users, Mail, CheckCircle } from "lucide-react";

const MembershipUnderReview = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{
      backgroundImage: "url('/assets/Faded-cards-background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <Navbar />



      {/* Centering wrapper */}
      <main className="flex flex-1 items-center justify-center px-4 py-20">

        {/* Main card with consistent sizing */}
        <Card className="w-full max-w-[600px] sm:max-w-[640px] md:max-w-[680px] bg-white border-gray-300 shadow-2xl">

          {/* Header with icon and title */}
          <CardHeader className="text-center space-y-6 pb-8 pt-10">
            <div className="flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600" />
              </div>
            </div>

            <h1 className="font-display text-[40px] sm:text-[44px] md:text-[48px] font-extrabold text-black tracking-wide">
              Membership Under Review
            </h1>

            <p className="text-gray-700 text-xl sm:text-2xl font-semibold tracking-wider max-w-[500px] mx-auto">
              Thank you for joining our poker club!
            </p>
          </CardHeader>

          {/* Content */}
          <CardContent className="space-y-8 px-8 sm:px-10 pb-10">



            {/* What happens next section */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <h3 className="text-black text-xl sm:text-2xl font-bold flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                What Happens Next?
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-base sm:text-lg">
                    We'll review your application within 24-48 hours
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-base sm:text-lg">
                    You'll receive an email notification with your approval status
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-base sm:text-lg">
                    Once approved, you can log in and start registering for events
                  </p>
                </div>
              </div>
            </div>

            {/* Contact info */}
            {/* <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-3">
              <h3 className="text-black text-lg sm:text-xl font-bold flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-600" />
                Questions?
              </h3>
              <p className="text-gray-700 text-base sm:text-lg">
                If you have any questions about your application, please contact us at:
              </p>
              <p className="text-black text-base sm:text-lg font-semibold">
                support@pokerclub.com
              </p>
            </div> */}

            {/* Back to home button */}
            <div className="pt-6">
              <a
                href="/"
                className="w-full h-14 sm:h-16 bg-[#cc2616] hover:bg-[#cc2616]/90 text-white text-xl sm:text-2xl font-extrabold py-3 rounded-xl tracking-wide flex items-center justify-center gap-3 transition-colors"
              >
                <Users className="w-6 h-6" />
                Back to Home
              </a>
            </div>

          </CardContent>
        </Card>
      </main>

    </div>
  );
};

export default MembershipUnderReview;