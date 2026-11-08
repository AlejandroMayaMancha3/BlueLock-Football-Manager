import { create } from 'zustand';
import { Club, Player, Match, ContractBid, YouthProspect } from '@/types/database';
import { INITIAL_CLUBS, INITIAL_PLAYERS, INITIAL_YOUTH_PROSPECTS } from '@/lib/data/initial-data';
import { simulateMatch, SimulationResult } from '@/engine/match-simulator';
import { EgoCritiqueResponse, generateEgoMatchCritique } from '@/lib/ai/narrative';

interface CareerState {
  currentWeek: number;
  userClubId: string;
  clubs: Club[];
  players: Player[];
  youthProspects: YouthProspect[];
  matches: Match[];
  contractBids: ContractBid[];
  lastSimulation: SimulationResult | null;
  lastEgoCritique: EgoCritiqueResponse | null;
  isSimulating: boolean;

  // Actions
  setUserClub: (clubId: string) => void;
  runMatchSimulation: (opponentClubId: string) => Promise<SimulationResult>;
  scoutProspect: (prospectId: string) => void;
  signProspect: (prospectId: string) => void;
  resetCareer: () => void;
}

export const useCareerStore = create<CareerState>((set, get) => ({
  currentWeek: 1,
  userClubId: '11111111-1111-1111-1111-111111111111', // Bastard München default
  clubs: INITIAL_CLUBS,
  players: INITIAL_PLAYERS,
  youthProspects: INITIAL_YOUTH_PROSPECTS,
  matches: [],
  contractBids: [
    {
      id: 'bid-0',
      player_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Michael Kaiser
      club_id: '11111111-1111-1111-1111-111111111111',
      salary_offer_yen: 320000000,
      status: 'accepted',
      week_number: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'bid-1',
      player_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // Rin Itoshi
      club_id: '22222222-2222-2222-2222-222222222222',
      salary_offer_yen: 240000000,
      status: 'accepted',
      week_number: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'bid-2',
      player_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Yoichi Isagi
      club_id: '11111111-1111-1111-1111-111111111111',
      salary_offer_yen: 150000000,
      status: 'accepted',
      week_number: 1,
      created_at: new Date().toISOString(),
    },
  ],
  lastSimulation: null,
  lastEgoCritique: null,
  isSimulating: false,

  setUserClub: (clubId: string) => set({ userClubId: clubId }),

  runMatchSimulation: async (opponentClubId: string) => {
    const { clubs, players, userClubId, currentWeek, contractBids } = get();

    set({ isSimulating: true });

    const homeClub = clubs.find((c) => c.id === userClubId) || clubs[0];
    const awayClub = clubs.find((c) => c.id === opponentClubId) || clubs[1];

    const homePlayers = players.filter((p) => p.club_id === homeClub.id);
    const awayPlayers = players.filter((p) => p.club_id === awayClub.id);

    // Run deterministic match simulation with seed
    const seed = `nel-w${currentWeek}-${homeClub.name}-${awayClub.name}-${Date.now()}`;
    const result = simulateMatch(homeClub, awayClub, homePlayers, awayPlayers, { seed });

    // Update player market values and ego meters in global state
    const updatedPlayers = players.map((p) => {
      const matchStat = result.playerStats[p.id];
      if (matchStat) {
        return {
          ...p,
          market_value_yen: matchStat.newBidYen,
          ego_rating: matchStat.egoMeter,
          flow_state: matchStat.flowActivated,
        };
      }
      return p;
    });

    // Record new contract bids generated from this match
    const newBids: ContractBid[] = result.summary.bidsGenerated.map((bg, idx) => {
      const targetPlayer = updatedPlayers.find((p) => p.name === bg.playerName);
      const biddingClub = clubs.find((c) => c.name === bg.biddingClub) || homeClub;
      return {
        id: `bid-w${currentWeek}-${idx}-${Date.now()}`,
        player_id: targetPlayer ? targetPlayer.id : 'unknown',
        club_id: biddingClub.id,
        salary_offer_yen: bg.offerYen,
        status: 'pending',
        week_number: currentWeek,
        created_at: new Date().toISOString(),
      };
    });

    // Record match in match history
    const newMatch: Match = {
      id: `match-w${currentWeek}-${Date.now()}`,
      home_club_id: homeClub.id,
      away_club_id: awayClub.id,
      tournament_name: 'Neo Egoist League',
      home_score: result.homeScore,
      away_score: result.awayScore,
      week_number: currentWeek,
      match_events: result.events,
      is_completed: true,
      played_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Generate Ego Jinpachi critique (AI with procedural fallback)
    const focusPlayer = homePlayers[0]?.name || 'Yoichi Isagi';
    const critique = await generateEgoMatchCritique(result, focusPlayer);

    set({
      players: updatedPlayers,
      contractBids: [...newBids, ...contractBids],
      matches: [newMatch, ...get().matches],
      lastSimulation: result,
      lastEgoCritique: critique,
      currentWeek: currentWeek + 1,
      isSimulating: false,
    });

    return result;
  },

  scoutProspect: (prospectId: string) => {
    set((state) => ({
      youthProspects: state.youthProspects.map((p) =>
        p.id === prospectId ? { ...p, status: 'scouted' } : p
      ),
    }));
  },

  signProspect: (prospectId: string) => {
    const { youthProspects, players, userClubId } = get();
    const prospect = youthProspects.find((p) => p.id === prospectId);
    if (!prospect) return;

    const newPlayer: Player = {
      id: `player-promoted-${Date.now()}`,
      club_id: userClubId,
      name: prospect.name,
      age: prospect.age,
      position: 'ST',
      overall: Math.min(85, Math.floor(prospect.potential * 0.88)),
      potential: prospect.potential,
      ego_rating: prospect.status === 'wild_card' ? 92 : 80,
      weapons: [
        {
          name: prospect.scouted_weapon,
          type: prospect.status === 'wild_card' ? 'physical' : 'striker',
          level: prospect.status === 'wild_card' ? 93 : 84,
          description: `Signature weapon scouted from ${prospect.high_school}`,
        },
      ],
      market_value_yen: prospect.status === 'wild_card' ? 45000000 : 15000000,
      is_national_eligible: true,
      stats: {
        pace: prospect.status === 'wild_card' ? 88 : 80,
        shooting: prospect.status === 'wild_card' ? 89 : 78,
        passing: 74,
        dribbling: 78,
        defense: 72,
        physical: prospect.status === 'wild_card' ? 95 : 76,
      },
      flow_state: false,
      created_at: new Date().toISOString(),
    };

    set({
      players: [newPlayer, ...players],
      youthProspects: youthProspects.map((p) =>
        p.id === prospectId ? { ...p, status: 'signed' } : p
      ),
    });
  },

  resetCareer: () => {
    set({
      currentWeek: 1,
      clubs: INITIAL_CLUBS,
      players: INITIAL_PLAYERS,
      youthProspects: INITIAL_YOUTH_PROSPECTS,
      matches: [],
      contractBids: [],
      lastSimulation: null,
      lastEgoCritique: null,
      isSimulating: false,
    });
  },
}));
