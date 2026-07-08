"use client";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader } from "@/components/ui/card";

const HouseRules = () => {
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

      <main className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader className="text-center pb-2">
              <h1 className="font-display text-4xl md:text-5xl font-extrabold text-black tracking-wide mb-2">
                House Rules
              </h1>
              <p className="text-gray-500 text-base">
                Tournament of Champions &mdash; Participation Agreement
              </p>
            </CardHeader>

            {/* <CardContent className="prose prose-lg max-w-none">
              <div className="space-y-8 text-gray-800 pt-2">

                <section>
                  <h2 className="text-2xl font-bold text-black mb-3">1. Respect & Conduct</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Treat all players, hosts, and guests with courtesy and respect at all times.</li>
                    <li>No harassment, abusive language, or aggressive behavior will be tolerated.</li>
                    <li>Players who are disruptive or disrespectful may be asked to leave without refund.</li>
                    <li>No phones at the table during a hand — keep conversations and distractions to a minimum.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-3">2. Buy-in & Cash Handling</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Buy-ins must be paid in full before receiving chips. No credit or IOUs.</li>
                    <li>All buy-ins and re-buys must be made between hands, not during an active pot.</li>
                    <li>Keep your chip stacks visible and organized at all times.</li>
                    <li>Table stakes apply — you may only play with chips that are on the table at the start of a hand.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-3">3. Fair Play</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Cheating, collusion, or soft play between players is strictly prohibited and will result in immediate removal.</li>
                    <li>One player to a hand — do not discuss your cards or give advice while a hand is in progress.</li>
                    <li>Act in turn. Acting out of turn, whether intentionally or not, may result in a penalty.</li>
                    <li>Showdown rules: the last aggressor must show first. Any player may request to see a called hand.</li>
                    <li>String bets are not allowed. Declare your action verbally before moving chips.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-3">4. Registration & Attendance</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>If you can no longer attend, please un-register as soon as possible so your seat can be offered to a waitlisted player.</li>
                    <li>Repeated no-shows without notice may affect your standing and ability to register for future events.</li>
                    <li>Seats are not held — if you are more than 30 minutes late without notice, your seat may be given to a waitlisted player.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-3">5. Host Property & Space</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Respect the host's home or venue — keep the space clean and tidy.</li>
                    <li>Food and drinks are a privilege, not a right. Clean up after yourself.</li>
                    <li>Smoking is not permitted indoors or near the entrance of the host's property.</li>
                    <li>Follow any additional rules set by the host for their specific venue.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-3">6. Disputes & Floor Decisions</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All disputes should be raised calmly and promptly — do not act on a hand in dispute.</li>
                    <li>The host or designated floor person has final say on all rulings. Their decision is binding.</li>
                    <li>Arguing excessively or disrespecting floor decisions may result in a penalty or removal.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-black mb-3">7. Membership & Guests</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>This is a private, members-only club. Do not share event details or locations publicly.</li>
                    <li>Guests may attend only when explicitly invited by the club. All guests are subject to the same rules as members.</li>
                    <li>Members are responsible for the conduct of any guests they bring.</li>
                  </ul>
                </section>

                <section className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h2 className="text-xl font-bold text-black mb-2">Agreement</h2>
                  <p className="text-gray-700">
                    By registering for or participating in any Tournament of Champions event, you confirm that you have read, understood, and agree to abide by these House Rules. The club reserves the right to update these rules at any time.
                  </p>
                </section>

              </div>
            </CardContent> */}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HouseRules;
