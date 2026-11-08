import seedrandom from 'seedrandom';
import { Player, Club, MatchEvent, Weapon } from '@/types/database';

export interface PlayerMatchStats {
  playerId: string;
  name: string;
  clubId: string;
  rating: number; // 1.0 to 10.0
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  duelsTotal: number;
  duelsWon: number;
  saves: number;
  egoMeter: number; // 0 - 100
  flowActivated: boolean;
  chemicalReactionsCount: number;
  newBidYen: number;
  bidClubName?: string;
  bidCommentary?: string;
}

export interface SimulationResult {
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  playerStats: Record<string, PlayerMatchStats>;
  summary: {
    manOfTheMatch: PlayerMatchStats;
    totalChemicalReactions: number;
    flowActivations: string[];
    bidsGenerated: Array<{
      playerName: string;
      biddingClub: string;
      offerYen: number;
      reason: string;
    }>;
  };
}

export interface MatchSimulationOptions {
  seed?: string | number;
  totalMinutes?: number; // defaults to 90
}

/**
 * Deterministic Blue Lock Match Simulator
 * Implements Turn-based Event Engine with:
 * - Weapon Calculation & Hierarchy (Metavision, Direct Shot, Kaiser Impact, Predator Eye)
 * - Dynamic Ego Meter & Flow State Activation
 * - Chemical Reaction Pairings
 * - NEL Yen Bid Valuation Algorithm
 */
export function simulateMatch(
  homeClub: Club,
  awayClub: Club,
  homePlayers: Player[],
  awayPlayers: Player[],
  options: MatchSimulationOptions = {}
): SimulationResult {
  const seed = options.seed ? String(options.seed) : `${homeClub.name}-vs-${awayClub.name}-week`;
  const rng = seedrandom(seed);

  const events: MatchEvent[] = [];
  let homeScore = 0;
  let awayScore = 0;

  // Initialize player match stats
  const playerStats: Record<string, PlayerMatchStats> = {};
  const allPlayers = [...homePlayers, ...awayPlayers];

  allPlayers.forEach((p) => {
    playerStats[p.id] = {
      playerId: p.id,
      name: p.name,
      clubId: p.club_id || '',
      rating: 6.0,
      goals: 0,
      assists: 0,
      shots: 0,
      shotsOnTarget: 0,
      duelsTotal: 0,
      duelsWon: 0,
      saves: 0,
      egoMeter: p.ego_rating || 50,
      flowActivated: false,
      chemicalReactionsCount: 0,
      newBidYen: p.market_value_yen,
    };
  });

  // Helper to get weapon of player
  const findWeapon = (p: Player, typeName: string): Weapon | undefined => {
    return p.weapons?.find(
      (w) =>
        w.name.toLowerCase().includes(typeName.toLowerCase()) ||
        w.type.toLowerCase().includes(typeName.toLowerCase())
    );
  };

  // Helper to pick a player from a team
  const pickPlayer = (team: Player[], positionFilter?: (pos: string) => boolean): Player => {
    const candidates = positionFilter ? team.filter((p) => positionFilter(p.position)) : team;
    const pool = candidates.length > 0 ? candidates : team;
    const idx = Math.floor(rng() * pool.length);
    return pool[idx];
  };

  // Check chemical reaction potential between two players
  const checkChemicalReaction = (p1: Player, p2: Player): { triggered: boolean; name: string; boost: number } => {
    if (!p1 || !p2 || p1.id === p2.id) return { triggered: false, name: '', boost: 0 };

    const w1 = p1.weapons.map((w) => w.name.toLowerCase());
    const w2 = p2.weapons.map((w) => w.name.toLowerCase());

    // Isagi (Metavision/Direct Shot) + Dribbler / Passer
    if (w1.some((w) => w.includes('metavision')) && w2.some((w) => w.includes('dribble') || w.includes('passer'))) {
      return { triggered: true, name: 'Spatial Resonance Overlap', boost: 25 };
    }
    // Kaiser Impact + Metavision pass
    if (w1.some((w) => w.includes('kaiser impact')) || w2.some((w) => w.includes('kaiser impact'))) {
      return { triggered: true, name: 'Emperor Rationality Drive', boost: 30 };
    }
    // Snuffy Tactics + Barou Predator Eye
    if (w1.some((w) => w.includes('tactics')) && w2.some((w) => w.includes('predator'))) {
      return { triggered: true, name: 'Anarchic King Infiltration', boost: 35 };
    }
    // Speed Burst + Curved Shot / Extreme Biomechanics
    if (w1.some((w) => w.includes('speed')) && w2.some((w) => w.includes('curved') || w.includes('biomechanics'))) {
      return { triggered: true, name: 'Supersonic Blitz Link', boost: 28 };
    }

    // Generic synergy if both have high ego
    if (p1.ego_rating > 85 && p2.ego_rating > 85 && rng() > 0.6) {
      return { triggered: true, name: 'Egoist Clashing Resonance', boost: 20 };
    }

    return { triggered: false, name: '', boost: 0 };
  };

  // Turn-based timeline: 10 key highlight turns over 90 minutes
  const totalTurns = 12;
  const minutes = [6, 14, 23, 35, 42, 51, 63, 72, 81, 88, 90, 93];

  for (let turn = 0; turn < totalTurns; turn++) {
    const minute = minutes[turn] || Math.floor((turn / totalTurns) * 90);

    // Decide attacking team based on club reputation and tactical style
    const homeWeight = homeClub.reputation + (rng() * 20 - 10);
    const awayWeight = awayClub.reputation + (rng() * 20 - 10);
    const attackingHome = homeWeight >= awayWeight;

    const attackingTeam = attackingHome ? homePlayers : awayPlayers;
    const defendingTeam = attackingHome ? awayPlayers : homePlayers;
    const attackingClub = attackingHome ? homeClub : awayClub;
    const defendingClub = attackingHome ? awayClub : homeClub;

    if (attackingTeam.length === 0 || defendingTeam.length === 0) continue;

    // Phase 1: Midfield Transition & Playmaking
    const playmaker = pickPlayer(attackingTeam, (pos) => ['CAM', 'CM', 'CDM', 'RW', 'LW', 'ST'].includes(pos));
    const primaryDefender = pickPlayer(defendingTeam, (pos) => ['CDM', 'CB', 'LB', 'RB', 'CM'].includes(pos));

    const playmakerStats = playerStats[playmaker.id];
    const defenderStats = playerStats[primaryDefender.id];

    playmakerStats.duelsTotal += 1;
    defenderStats.duelsTotal += 1;

    // Check Metavision or Playmaking weapons
    const metaVision = findWeapon(playmaker, 'metavision');
    const defenderMeta = findWeapon(primaryDefender, 'metavision');

    let attackerDuelScore = playmaker.stats.passing * 0.4 + playmaker.stats.dribbling * 0.4 + playmaker.ego_rating * 0.2;
    let defenderDuelScore = primaryDefender.stats.defense * 0.5 + primaryDefender.stats.physical * 0.3 + primaryDefender.ego_rating * 0.2;

    if (metaVision) {
      attackerDuelScore += (metaVision.level / 100) * 25;
      playmakerStats.egoMeter = Math.min(100, playmakerStats.egoMeter + 4);
    }
    if (defenderMeta) {
      defenderDuelScore += (defenderMeta.level / 100) * 22;
      defenderStats.egoMeter = Math.min(100, defenderStats.egoMeter + 3);
    }

    // Add randomness (form factor)
    attackerDuelScore += (rng() - 0.45) * 25;
    defenderDuelScore += (rng() - 0.45) * 25;

    const duelWonByAttacker = attackerDuelScore > defenderDuelScore;

    if (!duelWonByAttacker) {
      defenderStats.duelsWon += 1;
      defenderStats.rating = Math.min(10.0, defenderStats.rating + 0.3);
      events.push({
        minute,
        type: 'duel',
        description: `${primaryDefender.name} (${defendingClub.name}) reads the play perfectly with a surgical tackle, shutting down ${playmaker.name}'s build-up.`,
        player_id: primaryDefender.id,
        player_name: primaryDefender.name,
        secondary_player_id: playmaker.id,
        secondary_player_name: playmaker.name,
        ego_impact: 3,
      });
      continue;
    }

    // Duel won by attacker
    playmakerStats.duelsWon += 1;
    playmakerStats.rating = Math.min(10.0, playmakerStats.rating + 0.2);

    // Phase 2: Key Pass & Chemical Reaction Check
    const striker = pickPlayer(attackingTeam, (pos) => ['ST', 'CF', 'RW', 'LW'].includes(pos));
    const strikerStats = playerStats[striker.id];

    const chemicalReaction = checkChemicalReaction(playmaker, striker);
    let keyPassSuccess = true;

    if (chemicalReaction.triggered) {
      playmakerStats.chemicalReactionsCount += 1;
      strikerStats.chemicalReactionsCount += 1;
      playmakerStats.egoMeter = Math.min(100, playmakerStats.egoMeter + 8);
      strikerStats.egoMeter = Math.min(100, strikerStats.egoMeter + 10);

      events.push({
        minute,
        type: 'chemical_reaction',
        description: `⚡ CHEMICAL REACTION! [${chemicalReaction.name}] between ${playmaker.name} and ${striker.name}! The field coordinates synchronize instantly!`,
        player_id: striker.id,
        player_name: striker.name,
        secondary_player_id: playmaker.id,
        secondary_player_name: playmaker.name,
        ego_impact: 10,
      });
    }

    // Phase 3: Flow State Activation Check
    if (strikerStats.egoMeter >= 85 && !strikerStats.flowActivated && rng() > 0.35) {
      strikerStats.flowActivated = true;
      strikerStats.rating = Math.min(10.0, strikerStats.rating + 0.6);
      events.push({
        minute,
        type: 'flow_trigger',
        description: `🔥 FLOW STATE UNLOCKED! ${striker.name}'s eyes ignite with total egocentrism! Senses heighten to pure instinctual reflex!`,
        player_id: striker.id,
        player_name: striker.name,
        ego_impact: 15,
      });
    }

    // Phase 4: Shot Opportunity & Goalkeeper Duel
    strikerStats.shots += 1;
    const goalkeeper = defendingTeam.find((p) => p.position === 'GK') || pickPlayer(defendingTeam);
    const gkStats = playerStats[goalkeeper.id];

    // Calculate striking power & weapon bonus
    let shotPower = striker.stats.shooting * 0.5 + striker.overall * 0.3 + (strikerStats.flowActivated ? 25 : 0);
    const directShot = findWeapon(striker, 'direct shot');
    const kaiserImpact = findWeapon(striker, 'kaiser impact');
    const predatorEye = findWeapon(striker, 'predator eye');
    const curvedShot = findWeapon(striker, 'curved shot');
    const extremeBiomechanics = findWeapon(striker, 'extreme biomechanics');

    let weaponUsedName: string | undefined;

    if (kaiserImpact) {
      shotPower += 35;
      weaponUsedName = 'Kaiser Impact';
    } else if (directShot) {
      shotPower += 22;
      weaponUsedName = 'Direct Shot';
    } else if (predatorEye) {
      shotPower += 24;
      weaponUsedName = 'Predator Eye';
    } else if (curvedShot) {
      shotPower += 20;
      weaponUsedName = 'Curved Shot';
    } else if (extremeBiomechanics) {
      shotPower += 26;
      weaponUsedName = 'Extreme Biomechanics';
    }

    if (chemicalReaction.triggered) {
      shotPower += chemicalReaction.boost;
    }

    // Goalkeeper Defense
    const scorpionSaves = findWeapon(goalkeeper, 'scorpion saves');
    let gkSavePower = (goalkeeper.stats.defense || 80) * 0.6 + goalkeeper.overall * 0.3;
    if (scorpionSaves) {
      gkSavePower += 20;
    }
    gkSavePower += (rng() - 0.45) * 30;

    const isShotOnTarget = rng() > 0.15; // 85% on target in high-level match
    if (isShotOnTarget) {
      strikerStats.shotsOnTarget += 1;
    }

    if (isShotOnTarget && shotPower > gkSavePower) {
      // GOAL!
      if (attackingHome) {
        homeScore += 1;
      } else {
        awayScore += 1;
      }

      strikerStats.goals += 1;
      strikerStats.rating = Math.min(10.0, strikerStats.rating + 1.2);
      playmakerStats.assists += 1;
      playmakerStats.rating = Math.min(10.0, playmakerStats.rating + 0.7);

      const weaponPhrase = weaponUsedName ? ` unleashing weapon [${weaponUsedName}]` : '';
      events.push({
        minute,
        type: 'goal',
        description: `⚽ GOOOOOAL! ${striker.name} destroys the defensive line${weaponPhrase}! Set up by an exquisite ball from ${playmaker.name}. (${homeClub.name} ${homeScore} - ${awayScore} ${awayClub.name})`,
        player_id: striker.id,
        player_name: striker.name,
        secondary_player_id: playmaker.id,
        secondary_player_name: playmaker.name,
        weapon_used: weaponUsedName,
        ego_impact: 20,
      });
    } else if (isShotOnTarget) {
      // Saved by Goalkeeper!
      gkStats.saves += 1;
      gkStats.duelsWon += 1;
      gkStats.rating = Math.min(10.0, gkStats.rating + 0.5);
      const gkWeaponPhrase = scorpionSaves ? ` with an impossible [Scorpion Save]!` : ` with elite positional reflexes!`;
      events.push({
        minute,
        type: 'save',
        description: `🧤 SPECTACULAR SAVE! ${goalkeeper.name} stops ${striker.name}'s vicious strike${gkWeaponPhrase}`,
        player_id: goalkeeper.id,
        player_name: goalkeeper.name,
        secondary_player_id: striker.id,
        secondary_player_name: striker.name,
        ego_impact: 12,
      });
    } else {
      // Off target
      events.push({
        minute,
        type: 'duel',
        description: `${striker.name}'s ambitious effort misses just wide of the post under heavy pressure from the center backs.`,
        player_id: striker.id,
        player_name: striker.name,
        ego_impact: -2,
      });
    }
  }

  // Phase 5: Post-Match Valuation & NEL Auction Bids (in Yen ¥)
  const bidsGenerated: Array<{
    playerName: string;
    biddingClub: string;
    offerYen: number;
    reason: string;
  }> = [];

  const europeanClubs = [
    'Bastard München',
    'Paris X Gen',
    'Manshine City',
    'Ubers',
    'FC Barcha',
    'Real Madrid',
    'Arsenal FC',
  ];

  allPlayers.forEach((p) => {
    const stats = playerStats[p.id];
    let bidDeltaYen = 0;

    // Performance based bid calculation
    if (stats.goals > 0) {
      bidDeltaYen += stats.goals * 30000000; // ¥30,000,000 per goal
    }
    if (stats.assists > 0) {
      bidDeltaYen += stats.assists * 15000000; // ¥15,000,000 per assist
    }
    if (stats.duelsWon >= 3) {
      bidDeltaYen += 10000000; // ¥10,000,000 for duel dominance
    }
    if (stats.saves >= 2) {
      bidDeltaYen += stats.saves * 12000000; // ¥12,000,000 per key save
    }
    if (stats.flowActivated) {
      bidDeltaYen += 25000000; // ¥25,000,000 Flow hype premium
    }
    if (stats.chemicalReactionsCount > 0) {
      bidDeltaYen += stats.chemicalReactionsCount * 8000000;
    }

    // High rating multiplier
    if (stats.rating >= 8.5) {
      bidDeltaYen = Math.floor(bidDeltaYen * 1.35);
    } else if (stats.rating < 6.0) {
      bidDeltaYen = Math.max(-5000000, Math.floor(bidDeltaYen * 0.5));
    }

    const previousValue = p.market_value_yen || 10000000;
    stats.newBidYen = Math.max(10000000, previousValue + bidDeltaYen);

    // If impressive game, generate explicit European bid
    if (stats.goals > 0 || stats.assists > 0 || stats.rating >= 7.8 || stats.saves >= 2) {
      const interestedClubs = europeanClubs.filter((c) => c !== p.club_id);
      const chosenClub = interestedClubs[Math.floor(rng() * interestedClubs.length)] || 'Bastard München';
      stats.bidClubName = chosenClub;

      const reasons: string[] = [];
      if (stats.goals > 0) reasons.push(`${stats.goals} goal(s)`);
      if (stats.assists > 0) reasons.push(`${stats.assists} assist(s)`);
      if (stats.flowActivated) reasons.push('unlocked Flow state');
      if (stats.saves >= 2) reasons.push(`${stats.saves} decisive saves`);
      const reasonText = reasons.join(', ') || `Match rating of ${stats.rating.toFixed(1)}`;

      stats.bidCommentary = `${chosenClub} submits an annual wage offer of ¥${stats.newBidYen.toLocaleString()} after scouting: ${reasonText}.`;
      bidsGenerated.push({
        playerName: p.name,
        biddingClub: chosenClub,
        offerYen: stats.newBidYen,
        reason: reasonText,
      });
    }
  });

  // Pick Man of the Match
  let motm = Object.values(playerStats)[0];
  Object.values(playerStats).forEach((ps) => {
    if (ps.rating > motm.rating) {
      motm = ps;
    }
  });

  const totalChemicalReactions = Object.values(playerStats).reduce(
    (acc, ps) => acc + ps.chemicalReactionsCount,
    0
  );

  const flowActivations = Object.values(playerStats)
    .filter((ps) => ps.flowActivated)
    .map((ps) => ps.name);

  return {
    homeClub,
    awayClub,
    homeScore,
    awayScore,
    events,
    playerStats,
    summary: {
      manOfTheMatch: motm,
      totalChemicalReactions,
      flowActivations,
      bidsGenerated,
    },
  };
}
