"use client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { archivedEvents } from "@/data/mockData";
import { Calendar, Users, DollarSign } from "lucide-react";

const Archive = () => {
  return (
    <div className="min-h-screen " style={{
      backgroundImage: "url('/assets/Faded-cards-background.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <Navbar />



      {/* FULL WIDTH LAYOUT FIX */}
      <div className="w-full px-4 sm:px-10 md:px-16 lg:px-20 py-14">

        {/* TYPOGRAPHY SIZE FIX */}
        <div className="mb-12">
          <h1 className="font-display text-[48px] sm:text-[52px] md:text-[56px] font-extrabold tracking-wide mb-3">
            Archived Events
          </h1>
          <p className="text-muted-foreground text-xl sm:text-2xl md:text-3xl font-semibold tracking-wider">
            Past poker events from the club
          </p>
        </div>

        {/* EVENT CARDS */}
        {archivedEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {archivedEvents.map((event) => (
              <Card key={event.id} className="bg-card border-border opacity-90">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    {/* CARD TITLE BIGGER */}
                    <h3 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
                      {event.title}
                    </h3>

                    {/* BADGE BIGGER */}
                    <span className="bg-accent/20 text-accent px-3 py-1 rounded text-sm sm:text-base font-bold">
                      Completed
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* DATE */}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-lg font-bold tracking-wide">
                      {event.date} at {event.time}
                    </span>
                  </div>

                  {/* PLAYERS */}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-lg font-bold tracking-wide">
                      {event.maxPlayers} players
                    </span>
                  </div>

                  {/* BUY IN */}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-lg font-bold tracking-wide">
                      Buy-in: ${event.buyInMin}
                      {event.buyInMin !== event.buyInMax && ` – $${event.buyInMax}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            {/* EMPTY STATE BIGGER */}
            <p className="text-muted-foreground text-2xl sm:text-3xl font-bold tracking-wider">
              No archived events yet
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Archive;
