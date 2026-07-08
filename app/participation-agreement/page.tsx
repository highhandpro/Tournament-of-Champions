"use client";

import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const ParticipationAgreement = () => {
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
              <h1 className="font-display text-xl md:text-3xl font-extrabold text-black tracking-wide mb-4">
                Penny Ante Poker Club Home Game House Rules
              </h1>
              <p className="text-gray-900 text-lg font-semibold">
                Private Poker Cash Game Rules and Participation Agreement
              </p>
            </CardHeader>
            
            <CardContent className="prose prose-lg max-w-none text-black ">
              <p>These House Rules and Participation Agreement apply to a private social home poker game conducted for personal entertainment among invited players. All participants are expected to play on equal terms, follow the posted rules, and comply with all host instructions at all times. No person is entitled to any profit from the operation of the game other than personal winnings as a player. By registering for or participating in the game, you acknowledge that you have read, understood, and agree to these terms as a condition of participation. This game is intended to be conducted in a manner consistent with applicable Washington State law.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800 mt-5">
                <div className="space-y-4">
                  <section>
                    <h2 className="text-lg font-bold text-black mb-4">1. Game Format</h2>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Private social home poker cash game.</li>
                      <li>Games may include No-Limit Texas Hold'em (NLHE) and mixed games.</li>
                      <li>Buy-in range: $25 minimum to $100 maximum, unless otherwise posted for a specific game night.</li>
                      <li>No rake, no house cut, and no time charge.</li>
                      <li>Any game rotation, stakes, and betting structure for the night will be announced before play.</li>
                    </ul>
                  </section>
                  <section>
                    <h2 className="text-lg font-bold text-black mb-4">2. Player Funds and Chips</h2>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Players buy chips directly into the game within the posted buy-in range.</li>
                      <li>The host does not take any portion of player buy-ins, pots, or cash-outs.</li>
                      <li>Chips are for use in this private game only and are redeemed according to house cash-game procedures at the end of play.</li>
                    </ul>
                  </section>
                  <section>
                    <h2 className="text-lg font-bold text-black mb-4">3. Food and Beverages</h2>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Food and beverages may be offered by the host as optional personal hospitality.</li>
                      <li>FFood and beverages are not sold, are not part of the game, are not part of any buy-in, and are not required as a condition of participation.</li>
                      <li>Any voluntary contribution toward food, beverages, or household hosting expenses is separate from game play and does not affect a person's ability to register, participate, or continue playing.</li>
                      <li>Players may bring optional potluck items, but this is not required to play.</li>
                    </ul>
                  </section>
                  <section>
                    <h2 className="text-lg font-bold text-black mb-4">4. Equal Terms of Play</h2>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>All players participate on equal terms.</li>
                      <li>No player receives extra chips, preferred seating, or gameplay advantages in exchange for payments, donations, purchases, or contributions.</li>
                      <li>House rules apply equally to all players.</li>
                    </ul>
                  </section>
                </div>
                <div className="space-y-4">
                  <section>
                    <h2 className="text-lg font-bold text-black mb-4">5. Conduct and Sportsmanship</h2>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Be respectful to all players and the host.</li>
                      <li>No abusive behavior, harassment, cheating, or angle shooting.</li>
                      <li>Protect your hand and act in turn.</li>
                      <li>Verbal declarations are binding.</li>
                      <li>The host/floor decision is final for house-rule disputes.</li>
                    </ul>
                  </section>
                  <section>
                    <h2 className="text-lg font-bold text-black mb-4">6. Eligibility</h2>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>This is a private home game for invited players only.</li>
                      <li>Players must be 18 or older.</li>
                      <li>The host reserves the right to refuse entry or remove any player for disruptive behavior or violation of these rules.</li>
                    </ul>
                  </section>
                  <section>
                    <h2 className="text-lg font-bold text-black mb-4">7. Compliance and Game Integrity</h2>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>This is intended to be a private social home game for personal entertainment among invited players.</li>
                      <li>No house fee, seat fee, membership fee, or required hospitality payment is charged as a condition of play.</li>
                      <li>No purchase of food or beverages is required to play.</li>
                      <li>All players are expected to follow these rules and applicable host instructions throughout the event.</li>
                    </ul>
                  </section>
                  <section>
                    <h2 className="text-lg font-bold text-black mb-4">8. Acknowledgment</h2>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>By registering for or participating in the game, players acknowledge that they have read, understood, and agree to these House Rules and Participation Agreement.</li>
                    </ul>
                  </section>

                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ParticipationAgreement;