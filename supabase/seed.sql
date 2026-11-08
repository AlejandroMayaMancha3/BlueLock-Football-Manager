-- ==============================================================================
-- Blue Lock: Egoist Career Mode - Initial Seed Data
-- 5 NEL Powerhouses, Master Strikers, Egoists, & World Class Talents
-- ==============================================================================

-- 1. Insert NEL Clubs
INSERT INTO public.clubs (id, name, country, league, reputation, budget_yen, tactical_style)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Bastard München', 'Germany', 'Neo Egoist League', 94, 15000000000, 'Hyper-Rationality & Direct Precision'),
    ('22222222-2222-2222-2222-222222222222', 'Paris X Gen', 'France', 'Neo Egoist League', 93, 18000000000, 'Individual Revolution & Hyper-Offense'),
    ('33333333-3333-3333-3333-333333333333', 'Manshine City', 'England', 'Neo Egoist League', 91, 14000000000, 'Speed Rush & Physical Revolution'),
    ('44444444-4444-4444-4444-444444444444', 'Ubers', 'Italy', 'Neo Egoist League', 90, 12000000000, 'Tactical Schemes & Iron Defense'),
    ('55555555-5555-5555-5555-555555555555', 'FC Barcha', 'Spain', 'Neo Egoist League', 89, 11000000000, 'Creative Freedom & Monster Dribbling')
ON CONFLICT (name) DO UPDATE 
SET reputation = EXCLUDED.reputation, budget_yen = EXCLUDED.budget_yen, tactical_style = EXCLUDED.tactical_style;

-- 2. Insert Star Players and Master Strikers
INSERT INTO public.players (id, club_id, name, age, position, overall, potential, ego_rating, weapons, market_value_yen, is_national_eligible, stats, flow_state)
VALUES
    -- BASTARD MÜNCHEN
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'Yoichi Isagi',
        17,
        'ST',
        88,
        97,
        95,
        '[{"name": "Metavision", "type": "vision", "level": 94, "description": "360-degree spatial perception reading all lines of play"}, {"name": "Direct Shot", "type": "shooting", "level": 92, "description": "Lethal one-touch volley eliminating goalkeeper reaction time"}, {"name": "Off-The-Ball Movement", "type": "positioning", "level": 93, "description": "Blind spot exploitation slipping into the heart of defense"}, {"name": "Egocentrism", "type": "tactics", "level": 95, "description": "Understands the core driving motivations of allies and rivals"}]'::jsonb,
        150000000,
        true,
        '{"pace": 82, "shooting": 89, "passing": 86, "dribbling": 84, "defense": 78, "physical": 80}'::jsonb,
        false
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '11111111-1111-1111-1111-111111111111',
        'Michael Kaiser',
        19,
        'ST',
        93,
        98,
        98,
        '[{"name": "Kaiser Impact", "type": "shooting", "level": 99, "description": "Fastest swing speed in world soccer, undefendable point-blank missile"}, {"name": "Metavision", "type": "vision", "level": 95, "description": "Absolute peripheral field dominance"}, {"name": "Predator Eye", "type": "finishing", "level": 93, "description": "Waits until goalkeeper shifts weight to strike blind angle"}]'::jsonb,
        320000000,
        false,
        '{"pace": 89, "shooting": 97, "passing": 88, "dribbling": 91, "defense": 72, "physical": 87}'::jsonb,
        false
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '11111111-1111-1111-1111-111111111111',
        'Noel Noa',
        31,
        'ST',
        97,
        97,
        99,
        '[{"name": "Master Striker", "type": "finishing", "level": 99, "description": "Best striker in the world with zero unnecessary movements"}, {"name": "Perfect Ambidexterity", "type": "physical", "level": 99, "description": "100% equal striking power and precision in both legs"}, {"name": "Rational Machine", "type": "tactics", "level": 98, "description": "Only takes actions with mathematically provable outcomes"}]'::jsonb,
        1200000000,
        false,
        '{"pace": 94, "shooting": 99, "passing": 92, "dribbling": 94, "defense": 82, "physical": 96}'::jsonb,
        false
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '11111111-1111-1111-1111-111111111111',
        'Gin Gagamaru',
        17,
        'GK',
        85,
        91,
        84,
        '[{"name": "Scorpion Saves", "type": "goalkeeping", "level": 93, "description": "Acrobatic aerial saves using extreme body contortion"}, {"name": "Primal Reflexes", "type": "physical", "level": 91, "description": "Animalistic intuition on close-range rebounds"}]'::jsonb,
        32000000,
        true,
        '{"pace": 80, "shooting": 60, "passing": 70, "dribbling": 65, "defense": 92, "physical": 88}'::jsonb,
        false
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        '11111111-1111-1111-1111-111111111111',
        'Rensuke Kunigami',
        17,
        'ST',
        86,
        93,
        89,
        '[{"name": "Left-Foot Missile", "type": "shooting", "level": 94, "description": "Mid-range cannon with 40-meter strike zone"}, {"name": "Wild Card Body Spec", "type": "physical", "level": 96, "description": "Noel Noa replica physique built through grueling survival"}]'::jsonb,
        50000000,
        true,
        '{"pace": 84, "shooting": 92, "passing": 76, "dribbling": 80, "defense": 78, "physical": 95}'::jsonb,
        false
    ),

    -- PARIS X GEN
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        '22222222-2222-2222-2222-222222222222',
        'Rin Itoshi',
        16,
        'ST',
        91,
        98,
        98,
        '[{"name": "Curved Shot", "type": "shooting", "level": 96, "description": "Precision trajectory with wicked spin finding the side netting"}, {"name": "Flow State (Destruction)", "type": "flow", "level": 97, "description": "Brings out rivals strongest weapons solely to annihilate them"}, {"name": "Field Dominance", "type": "vision", "level": 94, "description": "Puppeteers both teams movements toward his shooting corridor"}]'::jsonb,
        240000000,
        true,
        '{"pace": 88, "shooting": 95, "passing": 90, "dribbling": 92, "defense": 81, "physical": 86}'::jsonb,
        false
    ),
    (
        '12121212-1212-1212-1212-121212121212',
        '22222222-2222-2222-2222-222222222222',
        'Ryusei Shidou',
        18,
        'ST',
        89,
        95,
        96,
        '[{"name": "Extreme Biomechanics", "type": "shooting", "level": 97, "description": "Scores from any angle or bodily contortion inside the box"}, {"name": "Penalty Box Monster", "type": "finishing", "level": 95, "description": "Superhuman instinct knowing exact goal location without looking"}]'::jsonb,
        160000000,
        true,
        '{"pace": 91, "shooting": 94, "passing": 78, "dribbling": 87, "defense": 68, "physical": 92}'::jsonb,
        false
    ),
    (
        '13131313-1313-1313-1313-131313131313',
        '22222222-2222-2222-2222-222222222222',
        'Julian Loki',
        17,
        'RW',
        95,
        99,
        97,
        '[{"name": "God Speed", "type": "speed", "level": 99, "description": "Transcendent top-end velocity leaving all defenders frozen"}, {"name": "Explosive Step", "type": "acceleration", "level": 99, "description": "Instantaneous 0 to 100 transition leaving no recovery window"}]'::jsonb,
        1100000000,
        false,
        '{"pace": 99, "shooting": 91, "passing": 89, "dribbling": 95, "defense": 70, "physical": 88}'::jsonb,
        false
    ),

    -- MANSHINE CITY
    (
        '14141414-1414-1414-1414-141414141414',
        '33333333-3333-3333-3333-333333333333',
        'Seishiro Nagi',
        17,
        'CF',
        88,
        97,
        86,
        '[{"name": "Trapping Prodigy", "type": "ball_control", "level": 99, "description": "Zero-momentum cushion killing ball velocity out of the stratosphere"}, {"name": "Five-Stage Fake Volley", "type": "shooting", "level": 95, "description": "Multi-feint juggling mid-air volley before landing"}]'::jsonb,
        88000000,
        true,
        '{"pace": 85, "shooting": 92, "passing": 85, "dribbling": 93, "defense": 65, "physical": 85}'::jsonb,
        false
    ),
    (
        '15151515-1515-1515-1515-151515151515',
        '33333333-3333-3333-3333-333333333333',
        'Hyoma Chigiri',
        17,
        'LW',
        87,
        94,
        90,
        '[{"name": "Speed 44-Area", "type": "speed", "level": 98, "description": "Deep diagonal cut-in sprint with 44-degree shooting sweet spot"}, {"name": "Panther Sniping", "type": "shooting", "level": 91, "description": "Curled shot into far top corner while sprinting full tilt"}]'::jsonb,
        65000000,
        true,
        '{"pace": 98, "shooting": 88, "passing": 82, "dribbling": 89, "defense": 74, "physical": 79}'::jsonb,
        false
    ),
    (
        '16161616-1616-1616-1616-161616161616',
        '33333333-3333-3333-3333-333333333333',
        'Chris Prince',
        29,
        'ST',
        96,
        96,
        97,
        '[{"name": "Perfect Physicality", "type": "physical", "level": 99, "description": "Ultimate balance of raw power, agility and muscular endurance"}, {"name": "Unpredictable Knuckleball", "type": "shooting", "level": 98, "description": "No-spin shot breaking erratically in flight defying physics"}]'::jsonb,
        1150000000,
        false,
        '{"pace": 93, "shooting": 98, "passing": 88, "dribbling": 92, "defense": 80, "physical": 99}'::jsonb,
        false
    ),

    -- UBERS
    (
        '17171717-1717-1717-1717-171717171717',
        '44444444-4444-4444-4444-444444444444',
        'Shoei Barou',
        18,
        'ST',
        89,
        95,
        97,
        '[{"name": "Predator Eye", "type": "finishing", "level": 96, "description": "Stalking goalkeeper stance to blast near-post bullet"}, {"name": "Chop Dribble", "type": "dribbling", "level": 93, "description": "Sharp 90-degree violent cut breaking defenders ankles"}, {"name": "Kings Dominance", "type": "physical", "level": 94, "description": "Brute force screening and uncompromising selfish strikes"}]'::jsonb,
        150000000,
        true,
        '{"pace": 86, "shooting": 95, "passing": 75, "dribbling": 89, "defense": 70, "physical": 94}'::jsonb,
        false
    ),
    (
        '18181818-1818-1818-1818-181818181818',
        '44444444-4444-4444-4444-444444444444',
        'Ikki Niko',
        16,
        'CB',
        84,
        92,
        86,
        '[{"name": "Metavision Defense", "type": "vision", "level": 92, "description": "Anticipates passing routes from the center back zone"}, {"name": "Watchtower Interceptions", "type": "defense", "level": 90, "description": "Clean standing tackles stopping transition counters"}]'::jsonb,
        40000000,
        true,
        '{"pace": 76, "shooting": 72, "passing": 88, "dribbling": 78, "defense": 91, "physical": 77}'::jsonb,
        false
    ),
    (
        '19191919-1919-1919-1919-191919191919',
        '44444444-4444-4444-4444-444444444444',
        'Marc Snuffy',
        35,
        'CAM',
        96,
        96,
        96,
        '[{"name": "Tactical Maestro", "type": "tactics", "level": 99, "description": "Master strategist engineering dozens of set-piece strategies"}, {"name": "Jiu-Jitsu Playmaking", "type": "passing", "level": 97, "description": "Absorbs physical challenges using leverage to feed free runners"}]'::jsonb,
        1050000000,
        false,
        '{"pace": 88, "shooting": 91, "passing": 98, "dribbling": 93, "defense": 86, "physical": 92}'::jsonb,
        false
    ),

    -- FC BARCHA
    (
        '20202020-2020-2020-2020-202020202020',
        '55555555-5555-5555-5555-555555555555',
        'Meguru Bachira',
        17,
        'RW',
        87,
        95,
        93,
        '[{"name": "Monster Dribble", "type": "dribbling", "level": 97, "description": "Instinctive street dribbling dancing through multi-man presses"}, {"name": "Ging-Style Aerials", "type": "passing", "level": 92, "description": "Elastic cross and rabona passes finding impossible targets"}]'::jsonb,
        79000000,
        true,
        '{"pace": 89, "shooting": 84, "passing": 88, "dribbling": 96, "defense": 68, "physical": 76}'::jsonb,
        false
    ),
    (
        '21212121-2121-2121-2121-212121212121',
        '55555555-5555-5555-5555-555555555555',
        'Lavinho',
        30,
        'LW',
        95,
        95,
        98,
        '[{"name": "Dribble Magician", "type": "dribbling", "level": 99, "description": "Capoeira-infused rhythm beating world-class defenders for fun"}, {"name": "Ging Dance", "type": "agility", "level": 98, "description": "Illusionary body feints without touching the ball"}]'::jsonb,
        1000000000,
        false,
        '{"pace": 94, "shooting": 92, "passing": 91, "dribbling": 99, "defense": 65, "physical": 86}'::jsonb,
        false
    ),

    -- WORLD 11 / INDEPENDENT EGOIST
    (
        '22222222-3333-4444-5555-666666666666',
        NULL,
        'Sae Itoshi',
        18,
        'CAM',
        92,
        98,
        95,
        '[{"name": "Metavision Precision", "type": "vision", "level": 97, "description": "Calculates the exact millimeter and timing of every trajectory"}, {"name": "Itoshi Passer", "type": "passing", "level": 98, "description": "Delivers surgical passes tailored to the receiver strengths"}, {"name": "Line Calculation", "type": "tactics", "level": 95, "description": "Draws defender angles open then slices through with lethal curve"}]'::jsonb,
        450000000,
        true,
        '{"pace": 88, "shooting": 89, "passing": 97, "dribbling": 94, "defense": 78, "physical": 82}'::jsonb,
        false
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Youth Prospects & Wild Card Project
INSERT INTO public.youth_prospects (name, age, scouted_weapon, potential, scouting_cost_yen, status, high_school)
VALUES
    ('Ryosuke Kira', 17, 'High School Jewel (First Touch & Linkup)', 82, 5000000, 'available', 'Ichinan High School'),
    ('Kensuke Asahi', 17, 'Aerial Header Dominance', 80, 4000000, 'available', 'Matsukaze Kokuou High'),
    ('Junichi Wanima', 17, 'Twin Synchronization Volley', 81, 4500000, 'available', 'Sendai High School'),
    ('Wild Card Prototype #07', 16, 'Forced Noel Noa Muscle Rebalance', 89, 20000000, 'wild_card', 'Blue Lock Wild Card Facility')
ON CONFLICT DO NOTHING;
