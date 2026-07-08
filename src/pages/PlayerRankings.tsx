import React from 'react';
import { useApp } from '../context/AppContext';
import { PlayerBanner } from '../components/PlayerBanner';
import { calculateStandings } from '../utils/stats';

export const PlayerRankings: React.FC = () => {
  const { state, activeSeason } = useApp();

  // Calculate standings dynamically
  const standings = activeSeason 
    ? calculateStandings(state, activeSeason.id) 
    : [];

  const activeSeasonToCPool = activeSeason
    ? state.tournaments
        .filter(t => t.seasonId === activeSeason.id && t.status === 'completed')
        .reduce((sum, t) => sum + t.totalDealerAppreciation, 0)
    : 0;

  // Helper to format date as D-MMM (e.g. 13-Jun)
  const formatHeaderDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${Number(day)}-${months[date.getMonth()]}`;
  };

  // Get completed tournaments sorted chronologically
  const completedTournaments = activeSeason
    ? state.tournaments
        .filter(t => t.seasonId === activeSeason.id && t.status === 'completed')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  return (
    <div className="player-page player-rankings-page animate-fade-in">
      <PlayerBanner>
        <h1 className="banner-title text-center">Season Standings</h1>
        {activeSeason && (
          <p className="banner-subtitle text-center">
            {activeSeason.name} Rankings
          </p>
        )}
      </PlayerBanner>

      <div className="player-page-content">
        
        {standings.length === 0 ? (
          <div className="no-standings-card glass-card">
            <p>No games played yet in the current season. Standings will appear once a tournament is completed!</p>
          </div>
        ) : (
          <div className="standings-panel glass-card">
            <div className="standings-header-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3>LEADERBOARD</h3>
                <p>Top players ranked by total points accumulated this season.</p>
              </div>
              {activeSeason && (
                <div style={{ backgroundColor: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', padding: '10px 20px', borderRadius: '10px', color: 'var(--color-gold)', fontWeight: 700, fontSize: '0.95rem' }}>
                  Season ToC Pool: ${activeSeasonToCPool}
                </div>
              )}
            </div>

            <div className="table-container" style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table className="standings-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '70px', textAlign: 'center' }}>LEADERS</th>
                    <th>NAME</th>
                    <th style={{ textAlign: 'center' }}>TOC SEAT</th>
                    <th style={{ textAlign: 'center', color: 'var(--color-gold)' }}>TOTAL POINTS</th>
                    <th style={{ textAlign: 'center' }}>FWD BALANCE</th>
                    {completedTournaments.map(t => (
                      <th key={t.id} style={{ textAlign: 'center' }}>
                        {formatHeaderDate(t.date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((player, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr key={player.memberId}>
                        <td style={{ fontWeight: 700, fontSize: '1.05rem', textAlign: 'center' }}>
                          {rank}
                        </td>
                        <td className="standing-player-name-cell">
                          {(() => {
                            const memberObj = state.members.find(m => m.id === player.memberId);
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {memberObj?.logoUrl ? (
                                  <img 
                                    src={memberObj.logoUrl} 
                                    alt="Logo" 
                                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} 
                                  />
                                ) : (
                                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                    ♣
                                  </div>
                                )}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {player.name}
                                  {player.wins > 0 && <span title="1st Place Winner" style={{ cursor: 'help' }}>👑</span>}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {player.tocSeat !== 'Alternate' ? (
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(212, 163, 89, 0.12)',
                              color: 'var(--text-gold)',
                              border: '1px solid rgba(212, 163, 89, 0.25)',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              display: 'inline-block'
                            }}>
                              {player.tocSeat}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              Alternate
                        </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-gold)' }}>
                          {player.points}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                          {player.fwdPoints}
                        </td>
                        {completedTournaments.map(t => {
                          const pts = player.gamePoints[t.id];
                          return (
                            <td key={t.id} style={{ textAlign: 'center', color: pts > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: pts > 0 ? 1 : 0.35 }}>
                              {pts !== undefined ? pts : 0}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Page Footer */}
        <footer className="player-page-footer">
          <p>© 2026 Tournament of Champions Club. All rights reserved.</p>
        </footer>

      </div>
    </div>
  );
};
