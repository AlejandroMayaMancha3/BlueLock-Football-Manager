-- ==============================================================================
-- Blue Lock: Egoist Career Mode - 5 Major European Leagues & 4-Tier Pyramids
-- Migration 0002: Divisions, Dynamic Positions, Playoffs & Career Cloud Sync
-- ==============================================================================

-- 1. TABLA: DIVISIONS (Estructura de las 4 divisiones por país)
CREATE TABLE IF NOT EXISTS public.divisions (
    id TEXT PRIMARY KEY,                       -- Ej: 'es_laliga', 'es_hypermotion', 'en_premier', etc.
    country TEXT NOT NULL,                     -- 'Spain', 'England', 'Germany', 'Italy', 'France'
    name TEXT NOT NULL,                        -- 'LaLiga EA Sports', 'Premier League', etc.
    tier INT NOT NULL CHECK (tier BETWEEN 1 AND 4),
    total_teams INT NOT NULL CHECK (total_teams > 0),
    promotion_direct INT NOT NULL DEFAULT 0 CHECK (promotion_direct >= 0),
    promotion_playoff INT NOT NULL DEFAULT 0 CHECK (promotion_playoff >= 0),
    relegation_direct INT NOT NULL DEFAULT 0 CHECK (relegation_direct >= 0),
    relegation_playoff INT NOT NULL DEFAULT 0 CHECK (relegation_playoff >= 0),
    has_groups BOOLEAN NOT NULL DEFAULT false,
    groups_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. AMPLIAR TABLA: CLUBS (Añadir división, nivel, estadio y estadísticas de liga)
ALTER TABLE public.clubs 
    ADD COLUMN IF NOT EXISTS division_id TEXT REFERENCES public.divisions(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS tier INT NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 4),
    ADD COLUMN IF NOT EXISTS group_id TEXT,
    ADD COLUMN IF NOT EXISTS short_name TEXT,
    ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#1e293b',
    ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#38bdf8',
    ADD COLUMN IF NOT EXISTS stadium_name TEXT DEFAULT 'Municipal Arena',
    ADD COLUMN IF NOT EXISTS stadium_capacity INT NOT NULL DEFAULT 15000 CHECK (stadium_capacity >= 500),
    ADD COLUMN IF NOT EXISTS ticket_price_yen BIGINT NOT NULL DEFAULT 4000 CHECK (ticket_price_yen >= 0),
    ADD COLUMN IF NOT EXISTS wage_budget_yen BIGINT NOT NULL DEFAULT 50000000 CHECK (wage_budget_yen >= 0),
    ADD COLUMN IF NOT EXISTS is_user_club BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS season_points INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS season_wins INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS season_draws INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS season_losses INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS season_goals_for INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS season_goals_against INT NOT NULL DEFAULT 0;

-- 3. ACTUALIZAR RESTRICCIÓN DE POSICIONES EN: PLAYERS
-- Permite las 14 posiciones tácticas en español y compatibilidad internacional
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_position_check;
ALTER TABLE public.players ADD CONSTRAINT players_position_check CHECK (
    position IN (
        'POR', 'DFC', 'LI', 'LD', 'CAI', 'CAD', 'MCD', 'MC', 'MI', 'MD', 'MCO', 'EI', 'ED', 'DC',
        'GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'LM', 'RM', 'CAM', 'LW', 'RW', 'CF', 'ST'
    )
);

-- Nuevas columnas en PLAYERS (planes de desarrollo, contratos, parodias sin licencia)
ALTER TABLE public.players
    ADD COLUMN IF NOT EXISTS secondary_position TEXT,
    ADD COLUMN IF NOT EXISTS training_plan JSONB DEFAULT '{"focus": "balanced", "positionConversion": null}'::jsonb,
    ADD COLUMN IF NOT EXISTS fitness INT NOT NULL DEFAULT 100 CHECK (fitness BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS morale INT NOT NULL DEFAULT 85 CHECK (morale BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS weekly_wage_yen BIGINT NOT NULL DEFAULT 500000 CHECK (weekly_wage_yen >= 0),
    ADD COLUMN IF NOT EXISTS contract_years INT NOT NULL DEFAULT 3 CHECK (contract_years >= 0),
    ADD COLUMN IF NOT EXISTS is_unlicensed_parody BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS real_name_reference TEXT;

-- 4. AMPLIAR TABLA: MATCHES (Playoffs, eliminatorias de ida y vuelta, desempates y penaltis)
ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS division_id TEXT REFERENCES public.divisions(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS is_playoff BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS playoff_stage TEXT, -- 'semi_final', 'final', 'relegation_playoff', 'barrage', 'spareggio', 'playout'
    ADD COLUMN IF NOT EXISTS leg INT NOT NULL DEFAULT 1 CHECK (leg IN (0, 1, 2)), -- 0: partido único (Wembley/Spareggio), 1: Ida, 2: Vuelta
    ADD COLUMN IF NOT EXISTS penalty_home_score INT CHECK (penalty_home_score >= 0),
    ADD COLUMN IF NOT EXISTS penalty_away_score INT CHECK (penalty_away_score >= 0),
    ADD COLUMN IF NOT EXISTS aggregate_home_score INT CHECK (aggregate_home_score >= 0),
    ADD COLUMN IF NOT EXISTS aggregate_away_score INT CHECK (aggregate_away_score >= 0);

-- 5. TABLA: PLAYOFF_BRACKETS (Seguimiento de fases eliminatorias de ascenso/permanencia)
CREATE TABLE IF NOT EXISTS public.playoff_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id TEXT NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
    season_year INT NOT NULL DEFAULT 2026,
    bracket_type TEXT NOT NULL, -- 'promotion', 'relegation', 'barrage', 'playout'
    stage TEXT NOT NULL,        -- 'semi', 'final'
    home_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    away_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    winner_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABLA: USER_CAREERS (Guardado y sincronización en la nube de partidas completas)
CREATE TABLE IF NOT EXISTS public.user_careers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    career_name TEXT NOT NULL DEFAULT 'Egoist Career',
    country TEXT NOT NULL,
    active_division_id TEXT NOT NULL REFERENCES public.divisions(id),
    club_id UUID NOT NULL REFERENCES public.clubs(id),
    season_year INT NOT NULL DEFAULT 2026,
    current_week INT NOT NULL DEFAULT 1,
    currency TEXT NOT NULL DEFAULT 'EUR',
    save_snapshot JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ÍNDICES OPTIMIZADOS PARA RENDIMIENTO (SUPABASE BEST PRACTICES)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_divisions_country_tier ON public.divisions(country, tier);
CREATE INDEX IF NOT EXISTS idx_clubs_division_tier ON public.clubs(division_id, tier);
CREATE INDEX IF NOT EXISTS idx_clubs_country ON public.clubs(country);
CREATE INDEX IF NOT EXISTS idx_players_club_position ON public.players(club_id, position);
CREATE INDEX IF NOT EXISTS idx_players_overall ON public.players(overall DESC);
CREATE INDEX IF NOT EXISTS idx_matches_division_week ON public.matches(division_id, week_number);
CREATE INDEX IF NOT EXISTS idx_matches_is_playoff ON public.matches(is_playoff) WHERE is_playoff = true;
CREATE INDEX IF NOT EXISTS idx_playoff_division_season ON public.playoff_brackets(division_id, season_year);
CREATE INDEX IF NOT EXISTS idx_user_careers_user_id ON public.user_careers(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playoff_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Divisions are viewable by everyone" ON public.divisions
    FOR SELECT USING (true);
CREATE POLICY "Divisions editable by service role or anon dev" ON public.divisions
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Playoff brackets viewable by everyone" ON public.playoff_brackets
    FOR SELECT USING (true);
CREATE POLICY "Playoff brackets manageable by active session" ON public.playoff_brackets
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Users can view their own careers or anon careers" ON public.user_careers
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'anon');
CREATE POLICY "Users can insert their own careers" ON public.user_careers
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'anon');
CREATE POLICY "Users can update their own careers" ON public.user_careers
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'anon');
CREATE POLICY "Users can delete their own careers" ON public.user_careers
    FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'anon');
