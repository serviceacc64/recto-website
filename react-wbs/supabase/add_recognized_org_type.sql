-- Adds the group type used by the admin recognized organizations form.
-- Run this in Supabase SQL Editor if the recognized-structure table already exists.

ALTER TABLE public."recognized-structure"
  ADD COLUMN IF NOT EXISTS org_type text NOT NULL DEFAULT 'organization';

ALTER TABLE public."recognized-structure"
  DROP CONSTRAINT IF EXISTS recognized_structure_org_type_check;

ALTER TABLE public."recognized-structure"
  ADD CONSTRAINT recognized_structure_org_type_check
  CHECK (org_type IN ('organization', 'club'));
