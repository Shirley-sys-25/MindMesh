ALTER TABLE session_states
  ADD COLUMN IF NOT EXISTS objective_history JSONB NOT NULL DEFAULT '[]'::jsonb;
