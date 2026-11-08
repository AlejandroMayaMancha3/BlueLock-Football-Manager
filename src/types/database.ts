export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WeaponType =
  | 'vision'
  | 'shooting'
  | 'finishing'
  | 'speed'
  | 'acceleration'
  | 'physical'
  | 'ball_control'
  | 'dribbling'
  | 'passing'
  | 'defense'
  | 'goalkeeping'
  | 'tactics'
  | 'flow'
  | 'striker'
  | 'agility';

export interface Weapon {
  name: string;
  type: WeaponType;
  level: number; // 1 - 99
  description: string;
}

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
}

export interface Club {
  id: string;
  name: string;
  country: string;
  league: string;
  reputation: number;
  budget_yen: number;
  tactical_style: string;
  logo_url?: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  club_id: string | null;
  name: string;
  age: number;
  position: 'ST' | 'CF' | 'RW' | 'LW' | 'CAM' | 'CM' | 'CDM' | 'CB' | 'LB' | 'RB' | 'GK';
  overall: number;
  potential: number;
  ego_rating: number; // 0 - 100
  weapons: Weapon[];
  market_value_yen: number;
  is_national_eligible: boolean;
  stats: PlayerStats;
  flow_state: boolean;
  avatar_url?: string | null;
  created_at: string;
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'duel' | 'save' | 'foul' | 'chemical_reaction' | 'flow_trigger' | 'turnover';
  description: string;
  player_id?: string;
  player_name?: string;
  secondary_player_id?: string;
  secondary_player_name?: string;
  weapon_used?: string;
  ego_impact?: number;
}

export interface Match {
  id: string;
  home_club_id: string;
  away_club_id: string;
  tournament_name: string;
  home_score: number;
  away_score: number;
  week_number: number;
  match_events: MatchEvent[];
  is_completed: boolean;
  played_at?: string;
  created_at: string;
}

export interface ContractBid {
  id: string;
  player_id: string;
  club_id: string;
  salary_offer_yen: number;
  status: 'pending' | 'accepted' | 'rejected' | 'outbid';
  week_number: number;
  created_at: string;
}

export interface YouthProspect {
  id: string;
  name: string;
  age: number;
  scouted_weapon: string;
  potential: number;
  scouting_cost_yen: number;
  status: 'available' | 'scouted' | 'signed' | 'wild_card';
  high_school: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: Club;
        Insert: Omit<Club, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Club>;
      };
      players: {
        Row: Player;
        Insert: Omit<Player, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Player>;
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Match>;
      };
      contract_bids: {
        Row: ContractBid;
        Insert: Omit<ContractBid, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<ContractBid>;
      };
      youth_prospects: {
        Row: YouthProspect;
        Insert: Omit<YouthProspect, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<YouthProspect>;
      };
    };
  };
}
