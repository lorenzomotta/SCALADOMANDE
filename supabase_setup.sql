-- Script per creare le tabelle di SCALADOMANDE su Supabase
-- Puoi eseguirlo nello STESSO progetto Supabase di Quattro Parole
-- Esegui nel SQL Editor di Supabase (Dashboard → SQL Editor → New query)

-- ============================================================================
-- TABELLA ARGOMENTI (es. Storia, Geografia, Scienze...)
-- ============================================================================

CREATE TABLE IF NOT EXISTS argomenti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ============================================================================
-- TABELLA DOMANDE (10 domande per argomento, 4 risposte ciascuna)
-- ============================================================================

CREATE TABLE IF NOT EXISTS domande (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  argomento_id UUID NOT NULL REFERENCES argomenti(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero >= 1 AND numero <= 10),
  testo TEXT NOT NULL,
  risposta_a TEXT NOT NULL,
  risposta_b TEXT NOT NULL,
  risposta_c TEXT NOT NULL,
  risposta_d TEXT NOT NULL,
  risposta_corretta CHAR(1) NOT NULL CHECK (risposta_corretta IN ('A', 'B', 'C', 'D')),
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE (argomento_id, numero)
);

-- ============================================================================
-- INDICI per query veloci
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_domande_argomento ON domande(argomento_id);
CREATE INDEX IF NOT EXISTS idx_domande_numero ON domande(argomento_id, numero);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE argomenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE domande ENABLE ROW LEVEL SECURITY;

-- Policy: chiunque può leggere argomenti e domande
DROP POLICY IF EXISTS "Chiunque può leggere gli argomenti" ON argomenti;
CREATE POLICY "Chiunque può leggere gli argomenti"
ON argomenti FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Chiunque può leggere le domande" ON domande;
CREATE POLICY "Chiunque può leggere le domande"
ON domande FOR SELECT TO anon USING (true);

-- Policy: chiunque può inserire (la password è solo nell'app, come Quattro Parole)
DROP POLICY IF EXISTS "Chiunque può inserire argomenti" ON argomenti;
CREATE POLICY "Chiunque può inserire argomenti"
ON argomenti FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Chiunque può inserire domande" ON domande;
CREATE POLICY "Chiunque può inserire domande"
ON domande FOR INSERT TO anon WITH CHECK (true);

-- ============================================================================
-- DATI DI ESEMPIO (opzionale - commenta se non li vuoi)
-- ============================================================================

INSERT INTO argomenti (nome) VALUES ('Storia')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO argomenti (nome) VALUES ('Geografia')
ON CONFLICT (nome) DO NOTHING;

-- Domande di esempio per "Storia" (solo se l'argomento esiste e non ci sono già domande)
INSERT INTO domande (argomento_id, numero, testo, risposta_a, risposta_b, risposta_c, risposta_d, risposta_corretta)
SELECT a.id, 1, 'In che anno cadde l''Impero Romano d''Occidente?', '476 d.C.', '1492 d.C.', '1066 d.C.', '800 d.C.', 'A'
FROM argomenti a WHERE a.nome = 'Storia'
AND NOT EXISTS (SELECT 1 FROM domande d WHERE d.argomento_id = a.id AND d.numero = 1);

INSERT INTO domande (argomento_id, numero, testo, risposta_a, risposta_b, risposta_c, risposta_d, risposta_corretta)
SELECT a.id, 2, 'Chi fu il primo imperatore romano?', 'Augusto', 'Nerone', 'Cesare', 'Traiano', 'A'
FROM argomenti a WHERE a.nome = 'Storia'
AND NOT EXISTS (SELECT 1 FROM domande d WHERE d.argomento_id = a.id AND d.numero = 2);

-- ============================================================================
-- VERIFICA
-- ============================================================================

SELECT 'argomenti' AS tabella, COUNT(*) AS righe FROM argomenti
UNION ALL
SELECT 'domande', COUNT(*) FROM domande;
