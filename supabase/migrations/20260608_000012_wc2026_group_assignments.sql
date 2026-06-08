-- Migration 012: Set correct WC2026 group assignments + clean old seeded teams
-- Groups derived from ESPN match schedule (verified against full round-robin).
-- ESPN team names used exactly as they appear in the teams table.

-- Delete teams NOT referenced by any ESPN match (old seeded teams)
DELETE FROM teams
WHERE id NOT IN (
  SELECT COALESCE(team_a_id, '00000000-0000-0000-0000-000000000000'::uuid) FROM matches
  WHERE external_provider = 'espn' AND team_a_id IS NOT NULL
  UNION
  SELECT COALESCE(team_b_id, '00000000-0000-0000-0000-000000000000'::uuid) FROM matches
  WHERE external_provider = 'espn' AND team_b_id IS NOT NULL
);

-- Group A: Mexico, South Africa, South Korea, Czechia
UPDATE teams SET group_name = 'A' WHERE name IN ('Mexico','South Africa','South Korea','Czechia');

-- Group B: Canada, Bosnia-Herzegovina, Qatar, Switzerland
UPDATE teams SET group_name = 'B' WHERE name IN ('Canada','Bosnia-Herzegovina','Qatar','Switzerland');

-- Group C: United States, Paraguay, Türkiye, Australia
UPDATE teams SET group_name = 'C' WHERE name IN ('United States','Paraguay','Türkiye','Australia');

-- Group D: Haiti, Scotland, Brazil, Morocco
UPDATE teams SET group_name = 'D' WHERE name IN ('Haiti','Scotland','Brazil','Morocco');

-- Group E: Netherlands, Japan, Sweden, Tunisia
UPDATE teams SET group_name = 'E' WHERE name IN ('Netherlands','Japan','Sweden','Tunisia');

-- Group F: Germany, Curaçao, Ivory Coast, Ecuador
UPDATE teams SET group_name = 'F' WHERE name IN ('Germany','Curaçao','Ivory Coast','Ecuador');

-- Group G: Spain, Cape Verde, Saudi Arabia, Uruguay
UPDATE teams SET group_name = 'G' WHERE name IN ('Spain','Cape Verde','Saudi Arabia','Uruguay');

-- Group H: Belgium, Egypt, Iran, New Zealand
UPDATE teams SET group_name = 'H' WHERE name IN ('Belgium','Egypt','Iran','New Zealand');

-- Group I: Argentina, Algeria, Austria, Jordan
UPDATE teams SET group_name = 'I' WHERE name IN ('Argentina','Algeria','Austria','Jordan');

-- Group J: France, Senegal, Iraq, Norway
UPDATE teams SET group_name = 'J' WHERE name IN ('France','Senegal','Iraq','Norway');

-- Group K: Portugal, Congo DR, Colombia, Uzbekistan
UPDATE teams SET group_name = 'K' WHERE name IN ('Portugal','Congo DR','Colombia','Uzbekistan');

-- Group L: England, Croatia, Ghana, Panama
UPDATE teams SET group_name = 'L' WHERE name IN ('England','Croatia','Ghana','Panama');

-- Propagate group_name to group-stage matches from team_a's group
UPDATE matches m
SET group_name = t.group_name
FROM teams t
WHERE m.team_a_id = t.id
  AND m.stage = 'group'
  AND t.group_name IS NOT NULL;
