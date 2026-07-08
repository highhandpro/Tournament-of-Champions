export interface Player {
  firstName: string;
  lastInitial: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  seatsAvailable: number;
  maxPlayers: number;
  buyInMin: number;
  buyInMax: number;
  blinds: string;
  registeredPlayers: Player[];
  invitedPlayers: Player[];
  isArchived?: boolean;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Friday Night High Stakes",
    date: "January 17, 2026",
    time: "8:00 PM",
    seatsAvailable: 4,
    maxPlayers: 9,
    buyInMin: 200,
    buyInMax: 500,
    blinds: "$2/$5",
    registeredPlayers: [
      { firstName: "Michael", lastInitial: "S" },
      { firstName: "David", lastInitial: "K" },
      { firstName: "James", lastInitial: "R" },
      { firstName: "Robert", lastInitial: "L" },
      { firstName: "William", lastInitial: "T" },
    ],
    invitedPlayers: []
  },
  {
    id: "2",
    title: "Saturday Tournament",
    date: "January 18, 2026",
    time: "6:00 PM",
    seatsAvailable: 8,
    maxPlayers: 16,
    buyInMin: 100,
    buyInMax: 100,
    blinds: "25/50 starting",
    registeredPlayers: [
      { firstName: "Sarah", lastInitial: "M" },
      { firstName: "Emily", lastInitial: "C" },
      { firstName: "Daniel", lastInitial: "W" },
      { firstName: "Chris", lastInitial: "B" },
      { firstName: "Alex", lastInitial: "N" },
      { firstName: "Jessica", lastInitial: "P" },
      { firstName: "Thomas", lastInitial: "H" },
      { firstName: "Andrew", lastInitial: "G" },
    ],
    invitedPlayers: []
  },
  {
    id: "3",
    title: "Sunday Cash Game",
    date: "January 19, 2026",
    time: "2:00 PM",
    seatsAvailable: 6,
    maxPlayers: 8,
    buyInMin: 50,
    buyInMax: 200,
    blinds: "$1/$2",
    registeredPlayers: [
      { firstName: "Kevin", lastInitial: "J" },
      { firstName: "Brian", lastInitial: "D" },
    ],
    invitedPlayers: []
  },
  {
    id: "4",
    title: "Wednesday Night PLO",
    date: "January 22, 2026",
    time: "7:00 PM",
    seatsAvailable: 5,
    maxPlayers: 6,
    buyInMin: 100,
    buyInMax: 300,
    blinds: "$1/$2 PLO",
    registeredPlayers: [
      { firstName: "Mark", lastInitial: "A" },
    ],
    invitedPlayers: []
  },
  {
    id: "5",
    title: "Monthly Deepstack",
    date: "January 25, 2026",
    time: "4:00 PM",
    seatsAvailable: 12,
    maxPlayers: 20,
    buyInMin: 150,
    buyInMax: 150,
    blinds: "50/100 starting",
    registeredPlayers: [
      { firstName: "Peter", lastInitial: "F" },
      { firstName: "Steven", lastInitial: "Q" },
      { firstName: "George", lastInitial: "V" },
      { firstName: "Edward", lastInitial: "Z" },
      { firstName: "Charles", lastInitial: "X" },
      { firstName: "Paul", lastInitial: "Y" },
      { firstName: "Ryan", lastInitial: "U" },
      { firstName: "Jason", lastInitial: "I" },
    ],
    invitedPlayers: []
  },
];

export const archivedEvents: Event[] = [
  {
    id: "a1",
    title: "New Year's Eve Tournament",
    date: "December 31, 2025",
    time: "9:00 PM",
    seatsAvailable: 0,
    maxPlayers: 24,
    buyInMin: 200,
    buyInMax: 200,
    blinds: "50/100 starting",
    registeredPlayers: [],
    invitedPlayers: [],
    isArchived: true,
  },
  {
    id: "a2",
    title: "Holiday High Stakes",
    date: "December 24, 2025",
    time: "6:00 PM",
    seatsAvailable: 0,
    maxPlayers: 9,
    buyInMin: 500,
    buyInMax: 1000,
    blinds: "$5/$10",
    registeredPlayers: [],
    invitedPlayers: [],
    isArchived: true,
  },
];

export const mockMembers: Member[] = [
  { id: "m1", firstName: "Michael", lastName: "Smith", email: "michael.s@email.com", phone: "(555) 123-4567" },
  { id: "m2", firstName: "Sarah", lastName: "Miller", email: "sarah.m@email.com", phone: "(555) 234-5678" },
  { id: "m3", firstName: "David", lastName: "King", email: "david.k@email.com", phone: "(555) 345-6789" },
  { id: "m4", firstName: "Emily", lastName: "Chen", email: "emily.c@email.com", phone: "(555) 456-7890" },
  { id: "m5", firstName: "James", lastName: "Rodriguez", email: "james.r@email.com", phone: "(555) 567-8901" },
  { id: "m6", firstName: "Jessica", lastName: "Parker", email: "jessica.p@email.com", phone: "(555) 678-9012" },
];

export const mockUser = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@email.com",
  phone: "(555) 987-6543",
  memberSince: "January 2025",
  notes: "Referred by Michael S.",
};
