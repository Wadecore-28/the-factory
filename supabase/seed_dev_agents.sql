-- =============================================================================
-- Optional dev seed: profile row + 8 agents for Canvas testing
-- Run in Supabase SQL Editor (or psql) AFTER:
--   1) Migration 20260413000000_the_factory_schema.sql is applied
--   2) You have a real Auth user — replace BOSS_ID below with auth.users.id
--
-- If you use the handle_new_user trigger, profiles row may already exist;
-- then skip the INSERT into profiles and only INSERT agents.
-- =============================================================================

-- Replace this UUID with your user id from Authentication > Users
DO $$
DECLARE
  boss_id uuid := '00000000-0000-0000-0000-000000000001'; -- <<< CHANGE ME
BEGIN
  INSERT INTO public.profiles (id, full_name, company_name)
  VALUES (boss_id, 'The Boss (Dev)', 'The Factory')
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        company_name = EXCLUDED.company_name;

  INSERT INTO public.agents (user_id, name, color, level, current_xp, total_revenue, status)
  VALUES
    (boss_id, 'BOT-1', '#ef4444', 1, 0, 0.00, 'idle'),
    (boss_id, 'BOT-2', '#f97316', 1, 0, 0.00, 'working'),
    (boss_id, 'BOT-3', '#eab308', 2, 150, 12.50, 'idle'),
    (boss_id, 'BOT-4', '#22c55e', 1, 0, 0.00, 'waiting_approval'),
    (boss_id, 'BOT-5', '#14b8a6', 3, 400, 99.99, 'idle'),
    (boss_id, 'BOT-6', '#3b82f6', 1, 0, 0.00, 'idle'),
    (boss_id, 'BOT-7', '#a855f7', 2, 200, 45.00, 'working'),
    (boss_id, 'BOT-8', '#ec4899', 1, 0, 0.00, 'idle');
END;
$$;
