-- ============================================================
-- Schema Dispensa Sagra — eseguire nell'editor SQL di Supabase
-- ============================================================

-- Tabella prodotti
CREATE TABLE IF NOT EXISTS prodotti (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             TEXT NOT NULL,
  quantita         NUMERIC NOT NULL CHECK (quantita >= 0),
  unita            TEXT NOT NULL DEFAULT 'pezzi',
  data_preparazione DATE NOT NULL DEFAULT CURRENT_DATE,
  note             TEXT,
  qr_code          UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  barcode          TEXT UNIQUE,
  creato_il        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella movimenti
CREATE TABLE IF NOT EXISTS movimenti (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prodotto_id  UUID REFERENCES prodotti(id) ON DELETE SET NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('carico', 'scarico')),
  quantita     NUMERIC NOT NULL CHECK (quantita > 0),
  data_ora     TIMESTAMPTZ NOT NULL DEFAULT now(),
  note         TEXT
);

-- Indici per le query più comuni
CREATE INDEX IF NOT EXISTS idx_prodotti_data_prep ON prodotti(data_preparazione ASC);
CREATE INDEX IF NOT EXISTS idx_prodotti_qr_code   ON prodotti(qr_code);
CREATE INDEX IF NOT EXISTS idx_prodotti_barcode    ON prodotti(barcode);
CREATE INDEX IF NOT EXISTS idx_movimenti_data_ora  ON movimenti(data_ora DESC);
CREATE INDEX IF NOT EXISTS idx_movimenti_prodotto  ON movimenti(prodotto_id);

-- Row Level Security (RLS) — opzionale, abilita se usi auth
-- ALTER TABLE prodotti ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE movimenti ENABLE ROW LEVEL SECURITY;

-- Permessi pubblici (anonimo) per uso senza autenticazione
-- Rimuovere o limitare in produzione
GRANT SELECT, INSERT, UPDATE, DELETE ON prodotti  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON movimenti TO anon;
