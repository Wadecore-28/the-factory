-- =============================================================================
-- The Factory — Supabase schema migration
-- PostgreSQL / Supabase (auth.users + RLS for "The Boss")
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Types (task & memory status)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memory_type_enum') THEN
    CREATE TYPE public.memory_type_enum AS ENUM (
      'must_remember',
      'must_forget',
      'worked',
      'failed'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
    CREATE TYPE public.task_status_enum AS ENUM (
      'pending_approval',
      'approved',
      'rejected',
      'in_progress',
      'completed'
    );
  END IF;
END$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT NOT NULL DEFAULT 'The Factory',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  current_xp INTEGER NOT NULL DEFAULT 0 CHECK (current_xp >= 0),
  total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_revenue >= 0),
  status TEXT NOT NULL DEFAULT 'idle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents (id) ON DELETE CASCADE,
  memory_type public.memory_type_enum NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks_and_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status_enum NOT NULL DEFAULT 'pending_approval',
  revenue_generated NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.agent_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents (id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency INTEGER NOT NULL CHECK (proficiency BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  api_key_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Indexes (FK and common filters)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_agents_user_id ON public.agents (user_id);
CREATE INDEX idx_agent_memory_agent_id ON public.agent_memory (agent_id);
CREATE INDEX idx_tasks_and_activity_agent_id ON public.tasks_and_activity (agent_id);
CREATE INDEX idx_tasks_and_activity_status ON public.tasks_and_activity (status);
CREATE INDEX idx_agent_skills_agent_id ON public.agent_skills (agent_id);
CREATE INDEX idx_gateways_user_id ON public.gateways (user_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks_and_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateways ENABLE ROW LEVEL SECURITY;

-- profiles: owner only (id = auth.uid())
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- agents: rows where user_id = auth.uid()
CREATE POLICY "agents_select_own"
  ON public.agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "agents_insert_own"
  ON public.agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agents_update_own"
  ON public.agents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agents_delete_own"
  ON public.agents FOR DELETE
  USING (auth.uid() = user_id);

-- agent_memory: via parent agent ownership
CREATE POLICY "agent_memory_select_own"
  ON public.agent_memory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_memory.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_memory_insert_own"
  ON public.agent_memory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_memory.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_memory_update_own"
  ON public.agent_memory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_memory.agent_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_memory.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_memory_delete_own"
  ON public.agent_memory FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_memory.agent_id
        AND a.user_id = auth.uid()
    )
  );

-- tasks_and_activity: via parent agent ownership
CREATE POLICY "tasks_and_activity_select_own"
  ON public.tasks_and_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = tasks_and_activity.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_and_activity_insert_own"
  ON public.tasks_and_activity FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = tasks_and_activity.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_and_activity_update_own"
  ON public.tasks_and_activity FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = tasks_and_activity.agent_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = tasks_and_activity.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_and_activity_delete_own"
  ON public.tasks_and_activity FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = tasks_and_activity.agent_id
        AND a.user_id = auth.uid()
    )
  );

-- agent_skills: via parent agent ownership
CREATE POLICY "agent_skills_select_own"
  ON public.agent_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_skills.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_skills_insert_own"
  ON public.agent_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_skills.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_skills_update_own"
  ON public.agent_skills FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_skills.agent_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_skills.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_skills_delete_own"
  ON public.agent_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_skills.agent_id
        AND a.user_id = auth.uid()
    )
  );

-- gateways: user_id = auth.uid()
CREATE POLICY "gateways_select_own"
  ON public.gateways FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "gateways_insert_own"
  ON public.gateways FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gateways_update_own"
  ON public.gateways FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gateways_delete_own"
  ON public.gateways FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Optional: auto-create profile on signup (recommended for Next.js + Auth)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'The Factory')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Grants (Supabase roles)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
