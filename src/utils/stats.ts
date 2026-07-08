import type { DatabaseState } from '../types';

export interface PlayerStanding {
  memberId: string;
  name: string;
  points: number;
  fwdPoints: number; // Carry forward points
  played: number;
  wins: number;
  top10: number;
  earnings: number;
  bounties: number;
  gamePoints: Record<string, number>; // tournamentId -> pointsEarned
  tocSeat: 'Qualified by wins' | 'Qualified by points' | 'Alternate';
}

// Calculate standings for a specific season or all seasons if seasonId is empty
export const calculateStandings = (state: DatabaseState, seasonId?: string): PlayerStanding[] => {
  const activeMembers = state.members.filter(m => !m.isDeleted);
  const targetTournaments = state.tournaments
    .filter(t => t.status === 'completed' && (!seasonId || t.seasonId === seasonId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // sort chronologically

  const standingsMap: Record<string, Omit<PlayerStanding, 'tocSeat'>> = {};

  // Initialize standings for all active members
  activeMembers.forEach(m => {
    const fwdVal = Number(m.fwdPoints) || 0;
    standingsMap[m.id] = {
      memberId: m.id,
      name: `${m.firstName} ${m.lastName}`,
      points: fwdVal,
      fwdPoints: fwdVal,
      played: 0,
      wins: 0,
      top10: 0,
      earnings: 0,
      bounties: 0,
      gamePoints: {}
    };
  });

  // Accumulate from tournaments
  targetTournaments.forEach(t => {
    t.entries.forEach(entry => {
      // If member is soft-deleted, we still show them in stats, but might need to initialize map
      if (!standingsMap[entry.memberId]) {
        const deletedMember = state.members.find(m => m.id === entry.memberId);
        const fwdVal = deletedMember ? (Number(deletedMember.fwdPoints) || 0) : 0;
        standingsMap[entry.memberId] = {
          memberId: entry.memberId,
          name: deletedMember ? `${deletedMember.firstName} ${deletedMember.lastName} (Retired)` : 'Unknown Player',
          points: fwdVal,
          fwdPoints: fwdVal,
          played: 0,
          wins: 0,
          top10: 0,
          earnings: 0,
          bounties: 0,
          gamePoints: {}
        };
      }

      const standing = standingsMap[entry.memberId];
      const pts = entry.pointsEarned || 0;
      standing.points = Number((standing.points + pts).toFixed(1));
      standing.played += 1;
      if (entry.finishPosition === 1) standing.wins += 1;
      if (entry.finishPosition && entry.finishPosition <= 10) standing.top10 += 1;
      standing.earnings += entry.payoutEarned + (entry.bountiesCollected * t.bountyAmount);
      standing.bounties += entry.bountiesCollected;
      standing.gamePoints[t.id] = pts;
    });
  });

  // Convert map to sorted array
  const standingsList = Object.values(standingsMap)
    .filter(s => s.played > 0 || s.points > 0); // show players who played or have points

  // Sort by total points descending, then earnings, then wins
  standingsList.sort((a, b) => b.points - a.points || b.earnings - a.earnings || b.wins - a.wins);

  // Apply ToC Seat Qualification Logic
  // 1. Auto-qualify those with 2+ wins
  const autoQualifierIds = new Set(
    standingsList.filter(s => s.wins >= 2).map(s => s.memberId)
  );

  // 2. Points qualifiers (top point earners, up to 10 total seats minus auto-qualifiers)
  const totalSeats = 10;
  const autoQualifiersCount = autoQualifierIds.size;
  const remainingPointsSeats = Math.max(0, totalSeats - autoQualifiersCount);

  let pointsSeatsFilled = 0;
  
  return standingsList.map(s => {
    let tocSeat: 'Qualified by wins' | 'Qualified by points' | 'Alternate' = 'Alternate';
    
    if (autoQualifierIds.has(s.memberId)) {
      tocSeat = 'Qualified by wins';
    } else if (pointsSeatsFilled < remainingPointsSeats) {
      tocSeat = 'Qualified by points';
      pointsSeatsFilled++;
    }

    return {
      ...s,
      tocSeat
    };
  });
};

// Calculate lifetime stats for a single player
export interface MemberStats {
  played: number;
  wins: number;
  top10: number;
  earnings: number;
  bounties: number;
  points: number;
  avgFinish: number;
  recentFinishes: number[]; // positions of last 5 games
}

export const calculateMemberStats = (state: DatabaseState, memberId: string): MemberStats => {
  const completedTournaments = state.tournaments.filter(t => t.status === 'completed');
  
  let played = 0;
  let wins = 0;
  let top10 = 0;
  let earnings = 0;
  let bounties = 0;
  let points = 0;
  let totalFinishPositions = 0;
  let finishesCount = 0;
  const recentFinishes: number[] = [];

  // Sort tournaments chronologically to get recent finishes
  const sortedTournaments = [...completedTournaments].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedTournaments.forEach(t => {
    const entry = t.entries.find(e => e.memberId === memberId);
    if (entry) {
      played += 1;
      if (entry.finishPosition === 1) wins += 1;
      if (entry.finishPosition && entry.finishPosition <= 10) top10 += 1;
      earnings += entry.payoutEarned + (entry.bountiesCollected * t.bountyAmount);
      bounties += entry.bountiesCollected;
      points = Number((points + entry.pointsEarned).toFixed(1));
      if (entry.finishPosition) {
        totalFinishPositions += entry.finishPosition;
        finishesCount += 1;
        recentFinishes.push(entry.finishPosition);
      }
    }
  });

  const avgFinish = finishesCount > 0 ? Number((totalFinishPositions / finishesCount).toFixed(1)) : 0;
  
  return {
    played,
    wins,
    top10,
    earnings,
    bounties,
    points,
    avgFinish,
    recentFinishes: recentFinishes.slice(-5).reverse() // last 5, newest first
  };
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return dateStr;
};
