-- ============================================================
-- PRODE 2026 — Schema completo
-- Pegá esto en Supabase > SQL Editor > Run
-- ============================================================

-- Grupos de amigos
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Miembros del grupo
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Partidos del Mundial 2026
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_flag TEXT NOT NULL,
  away_flag TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Fase de Grupos',
  group_label TEXT,
  home_score INT,
  away_score INT,
  finished BOOLEAN DEFAULT FALSE,
  sort_order INT
);

-- Predicciones de cada usuario
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  home_score INT NOT NULL,
  away_score INT NOT NULL,
  points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_id, match_id)
);

-- ============================================================
-- RLS (Row Level Security) — seguridad por usuario
-- ============================================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Groups: cualquiera puede ver, solo el creador puede editar
CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Miembros: ver todos, insertarse solo uno mismo
CREATE POLICY "members_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "members_insert" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_delete" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Partidos: lectura pública, escritura solo service role (admin)
CREATE POLICY "matches_select" ON matches FOR SELECT USING (true);

-- Predicciones: cada usuario ve todas (para el ranking) pero solo edita las suyas
CREATE POLICY "predictions_select" ON predictions FOR SELECT USING (true);
CREATE POLICY "predictions_insert" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "predictions_update" ON predictions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN para calcular puntos automáticamente
-- Se ejecuta cuando se carga el resultado real de un partido
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finished = TRUE AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
    UPDATE predictions SET
      points = CASE
        -- Resultado exacto: 3 puntos
        WHEN home_score = NEW.home_score AND away_score = NEW.away_score THEN 3
        -- Resultado correcto (ganador/empate): 1 punto
        WHEN (home_score > away_score AND NEW.home_score > NEW.away_score) OR
             (home_score < away_score AND NEW.home_score < NEW.away_score) OR
             (home_score = away_score AND NEW.home_score = NEW.away_score) THEN 1
        ELSE 0
      END
    WHERE match_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_match_finished
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION calculate_points();

-- ============================================================
-- PARTIDOS del Mundial 2026 (Fase de Grupos — selección)
-- ============================================================
INSERT INTO matches (home_team, away_team, home_flag, away_flag, match_date, stage, group_label, sort_order) VALUES
('México', 'Ecuador', '🇲🇽', '🇪🇨', '2026-06-11 18:00:00-03', 'Fase de Grupos', 'Grupo A', 1),
('Canadá', 'Venezuela', '🇨🇦', '🇻🇪', '2026-06-12 15:00:00-03', 'Fase de Grupos', 'Grupo A', 2),
('Argentina', 'Chile', '🇦🇷', '🇨🇱', '2026-06-13 21:00:00-03', 'Fase de Grupos', 'Grupo B', 3),
('Uruguay', 'Bolivia', '🇺🇾', '🇧🇴', '2026-06-14 18:00:00-03', 'Fase de Grupos', 'Grupo B', 4),
('Brasil', 'Paraguay', '🇧🇷', '🇵🇾', '2026-06-15 21:00:00-03', 'Fase de Grupos', 'Grupo C', 5),
('Colombia', 'Perú', '🇨🇴', '🇵🇪', '2026-06-16 18:00:00-03', 'Fase de Grupos', 'Grupo C', 6),
('España', 'Marruecos', '🇪🇸', '🇲🇦', '2026-06-17 15:00:00-03', 'Fase de Grupos', 'Grupo D', 7),
('Francia', 'Alemania', '🇫🇷', '🇩🇪', '2026-06-18 21:00:00-03', 'Fase de Grupos', 'Grupo E', 8),
('Inglaterra', 'Países Bajos', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇳🇱', '2026-06-19 18:00:00-03', 'Fase de Grupos', 'Grupo F', 9),
('Portugal', 'Italia', '🇵🇹', '🇮🇹', '2026-06-20 21:00:00-03', 'Fase de Grupos', 'Grupo G', 10),
('Argentina', 'Bolivia', '🇦🇷', '🇧🇴', '2026-06-21 21:00:00-03', 'Fase de Grupos', 'Grupo B', 11),
('Brasil', 'Perú', '🇧🇷', '🇵🇪', '2026-06-22 18:00:00-03', 'Fase de Grupos', 'Grupo C', 12);
