export interface Event {
  _id: string;
  title: string;
  dateTime: string;
  location: string;
  buyInMin: number;
  buyInMax: number;
  hospitalityFee?: number;
  maxPlayers: number;
  eventType: "cash" | "tournament";
  blinds?: string;
  status: "ACTIVE" | "ARCHIVED";
  announcementTier1At?: string;
  registeredPlayers: any[];
  invitedPlayers: any[];
  waitlist: any[];
  seatsAvailable: number;
  description?: string;
  gameTitle?: string;
  gameDescription?: string;
  gameRules?: string[];
  gameNote?: string;
  details?: string;
  details1?: string;
  details2?: string;
  details3?: string;
  links?: { label: string; url: string }[];
  bannerImageUrl?: string;
  host?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}
