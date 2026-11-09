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
  | 'agility'
  | 'gk'
  | 'dribble';

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
  goalkeeping?: number;
}

export type SupportedPosition =
  | 'POR'
  | 'DFC'
  | 'LI'
  | 'LD'
  | 'CAI'
  | 'CAD'
  | 'MCD'
  | 'MC'
  | 'MI'
  | 'MD'
  | 'MCO'
  | 'EI'
  | 'ED'
  | 'DC'
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'LWB'
  | 'RWB'
  | 'CDM'
  | 'CM'
  | 'LM'
  | 'RM'
  | 'CAM'
  | 'LW'
  | 'RW'
  | 'CF'
  | 'ST';

export interface Division {
  id: string;
  country: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  total_teams: number;
  promotion_direct: number;
  promotion_playoff: number;
  relegation_direct: number;
  relegation_playoff: number;
  has_groups: boolean;
  groups_count: number;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  country: string;
  league: string;
  division_id?: string | null;
  tier?: 1 | 2 | 3 | 4;
  group_id?: string | null;
  short_name?: string | null;
  primary_color?: string;
  secondary_color?: string;
  stadium_name?: string;
  stadium_capacity?: number;
  ticket_price_yen?: number;
  wage_budget_yen?: number;
  reputation: number;
  budget_yen: number;
  tactical_style: string;
  logo_url?: string | null;
  is_user_club?: boolean;
  season_points?: number;
  season_wins?: number;
  season_draws?: number;
  season_losses?: number;
  season_goals_for?: number;
  season_goals_against?: number;
  created_at: string;
}

export interface Player {
  id: string;
  club_id: string | null;
  name: string;
  age: number;
  position: SupportedPosition;
  secondary_position?: SupportedPosition | null;
  overall: number;
  potential: number;
  ego_rating: number; // 0 - 100
  weapons: Weapon[];
  market_value_yen: number;
  weekly_wage_yen?: number;
  contract_years?: number;
  is_national_eligible: boolean;
  stats: PlayerStats;
  flow_state: boolean;
  fitness?: number;
  morale?: number;
  training_plan?: Record<string, unknown>;
  is_unlicensed_parody?: boolean;
  real_name_reference?: string | null;
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
  division_id?: string | null;
  is_playoff?: boolean;
  playoff_stage?: string | null;
  leg?: number;
  home_score: number;
  away_score: number;
  penalty_home_score?: number | null;
  penalty_away_score?: number | null;
  aggregate_home_score?: number | null;
  aggregate_away_score?: number | null;
  week_number: number;
  match_events: MatchEvent[];
  is_completed: boolean;
  played_at?: string;
  created_at: string;
}

export interface PlayoffBracket {
  id: string;
  division_id: string;
  season_year: number;
  bracket_type: 'promotion' | 'relegation' | 'barrage' | 'playout';
  stage: 'semi' | 'final';
  home_club_id: string;
  away_club_id: string;
  winner_club_id?: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
  created_at: string;
}

export interface UserCareer {
  id: string;
  user_id: string | null;
  career_name: string;
  country: string;
  active_division_id: string;
  club_id: string;
  season_year: number;
  current_week: number;
  currency: 'EUR' | 'USD' | 'JPY' | 'GBP';
  save_snapshot: Record<string, unknown>;
  updated_at: string;
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
      divisions: {
        Row: Division;
        Insert: Omit<Division, 'created_at'> & { created_at?: string };
        Update: Partial<Division>;
      };
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
      playoff_brackets: {
        Row: PlayoffBracket;
        Insert: Omit<PlayoffBracket, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<PlayoffBracket>;
      };
      user_careers: {
        Row: UserCareer;
        Insert: Omit<UserCareer, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<UserCareer>;
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
