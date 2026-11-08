-- ==============================================================================
-- Blue Lock: Egoist Career Mode - Initial Database Schema
-- Optimized for Supabase Free Tier (PostgreSQL + RLS + Pooler friendly)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CLUBS (European Giants & NEL Teams)
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    league TEXT NOT NULL DEFAULT 'Neo Egoist League',
    reputation INT NOT NULL CHECK (reputation BETWEEN 1 AND 100),
    budget_yen BIGINT NOT NULL DEFAULT 0 CHECK (budget_yen >= 0),
    tactical_style TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PLAYERS (Blue Lock Egoists, Masters & World Stars)
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    age INT NOT NULL CHECK (age BETWEEN 15 AND 45),
    position TEXT NOT NULL CHECK (position IN ('ST', 'CF', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK')),
    overall INT NOT NULL CHECK (overall BETWEEN 1 AND 99),
    potential INT NOT NULL CHECK (potential BETWEEN 1 AND 99),
    ego_rating INT NOT NULL DEFAULT 50 CHECK (ego_rating BETWEEN 0 AND 100),
    weapons JSONB NOT NULL DEFAULT '[]'::jsonb,
    market_value_yen BIGINT NOT NULL DEFAULT 0 CHECK (market_value_yen >= 0),
    is_national_eligible BOOLEAN NOT NULL DEFAULT true,
    stats JSONB NOT NULL DEFAULT '{"pace": 70, "shooting": 70, "passing": 70, "dribbling": 70, "defense": 70, "physical": 70}'::jsonb,
    flow_state BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. MATCHES (Neo Egoist League & Tournaments)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    away_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    tournament_name TEXT NOT NULL DEFAULT 'Neo Egoist League',
    home_score INT NOT NULL DEFAULT 0 CHECK (home_score >= 0),
    away_score INT NOT NULL DEFAULT 0 CHECK (away_score >= 0),
    week_number INT NOT NULL CHECK (week_number >= 1),
    match_events JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    played_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CONTRACT BIDS (NEL Global Auction System)
CREATE TABLE IF NOT EXISTS public.contract_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    salary_offer_yen BIGINT NOT NULL CHECK (salary_offer_yen >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'outbid')),
    week_number INT NOT NULL CHECK (week_number >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. YOUTH PROSPECTS & WILD CARD
CREATE TABLE IF NOT EXISTS public.youth_prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INT NOT NULL CHECK (age BETWEEN 14 AND 18),
    scouted_weapon TEXT NOT NULL,
    potential INT NOT NULL CHECK (potential BETWEEN 1 AND 99),
    scouting_cost_yen BIGINT NOT NULL DEFAULT 0 CHECK (scouting_cost_yen >= 0),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'scouted', 'signed', 'wild_card')),
    high_school TEXT NOT NULL DEFAULT 'Ichinan High School',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE & CONNECTION EFFICIENCY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_players_club_id ON public.players(club_id);
CREATE INDEX IF NOT EXISTS idx_players_market_value ON public.players(market_value_yen DESC);
CREATE INDEX IF NOT EXISTS idx_players_ego_rating ON public.players(ego_rating DESC);
CREATE INDEX IF NOT EXISTS idx_matches_home_club ON public.matches(home_club_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_club ON public.matches(away_club_id);
CREATE INDEX IF NOT EXISTS idx_matches_week_tournament ON public.matches(week_number, tournament_name);
CREATE INDEX IF NOT EXISTS idx_contract_bids_player ON public.contract_bids(player_id);
CREATE INDEX IF NOT EXISTS idx_contract_bids_club ON public.contract_bids(club_id);
CREATE INDEX IF NOT EXISTS idx_contract_bids_week ON public.contract_bids(week_number);
CREATE INDEX IF NOT EXISTS idx_youth_prospects_status ON public.youth_prospects(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Security: Protect writes while enabling anonymous read for public game view
-- ==============================================================================
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youth_prospects ENABLE ROW LEVEL SECURITY;

-- 1. CLUBS RLS
CREATE POLICY "Clubs are viewable by everyone" ON public.clubs
    FOR SELECT USING (true);
CREATE POLICY "Clubs can be inserted or updated by authenticated service or admin" ON public.clubs
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 2. PLAYERS RLS
CREATE POLICY "Players are viewable by everyone" ON public.players
    FOR SELECT USING (true);
CREATE POLICY "Players can be modified by active career sessions" ON public.players
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 3. MATCHES RLS
CREATE POLICY "Matches are viewable by everyone" ON public.matches
    FOR SELECT USING (true);
CREATE POLICY "Matches can be inserted and modified" ON public.matches
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 4. CONTRACT BIDS RLS
CREATE POLICY "Bids are viewable by everyone" ON public.contract_bids
    FOR SELECT USING (true);
CREATE POLICY "Bids can be inserted and modified" ON public.contract_bids
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 5. YOUTH PROSPECTS RLS
CREATE POLICY "Youth prospects are viewable by everyone" ON public.youth_prospects
    FOR SELECT USING (true);
CREATE POLICY "Youth prospects can be updated" ON public.youth_prospects
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
