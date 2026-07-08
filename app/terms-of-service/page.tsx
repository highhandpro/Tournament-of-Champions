"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{
      backgroundImage: "url('/assets/Faded-cards-background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <Navbar />
      
      <main className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader className="text-center">
              <h1 className="font-display text-4xl md:text-5xl font-extrabold text-black tracking-wide mb-4">
                Terms of Service
              </h1>
              <p className="text-gray-600 text-lg">
                Last updated: January 25, 2026
              </p>
            </CardHeader>
            
            <CardContent className="prose prose-lg max-w-none">
              <div className="space-y-8 text-gray-800">
                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">1. Acceptance of Terms</h2>
                  <p>
                    By accessing and using this poker club website and its services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">2. Membership Requirements</h2>
                  <p>
                    All members must be at least 18 years of age or the legal age of majority in their jurisdiction, whichever is higher. You must provide accurate and complete information during registration.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">3. Account Security</h2>
                  <p>
                    You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account or any other security breach.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">4. Prohibited Activities</h2>
                  <p>The following activities are strictly prohibited:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Cheating, collusion, or any form of unfair play</li>
                    <li>Use of automated software or bots</li>
                    <li>Multi-accounting without prior approval</li>
                    <li>Money laundering or fraudulent activities</li>
                    <li>Harassment or abusive behavior towards other members</li>
                    <li>Sharing of account credentials</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">5. Financial Transactions</h2>
                  <p>
                    All financial transactions must be conducted in accordance with our established procedures. We reserve the right to verify the source of funds and may request additional documentation when necessary.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">6. Privacy and Data Protection</h2>
                  <p>
                    Your privacy is important to us. All personal information collected will be used in accordance with our privacy policy and applicable data protection laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">7. Termination</h2>
                  <p>
                    We reserve the right to suspend or terminate your membership at any time for violation of these terms or for any other reason deemed necessary to protect the integrity of the club.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">8. Limitation of Liability</h2>
                  <p>
                    The club shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Participation in poker activities is at your own risk.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">9. Governing Law</h2>
                  <p>
                    These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the club operates, without regard to conflict of law provisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">10. Modifications</h2>
                  <p>
                    We reserve the right to modify these terms at any time. Continued use of our services after such modifications constitutes acceptance of the updated terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-4">Contact Information</h2>
                  <p>
                    If you have any questions about these Terms of Service, please contact us through the appropriate channels provided on our website.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
     
    </div>
  );
};

export default TermsOfService;