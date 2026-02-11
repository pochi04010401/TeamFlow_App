-- TeamFlow Security Hardening Migration
-- 1. Ensure RLS is enabled for all public tables
ALTER TABLE IF EXISTS members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS allowed_emails ENABLE ROW LEVEL SECURITY;

-- 2. Clean up potentially insecure open policies (Allow only authenticated users)
-- members
DO $$ BEGIN
  DROP POLICY IF EXISTS "認証ユーザーはメンバーを閲覧可能" ON members;
  DROP POLICY IF EXISTS "認証ユーザーはメンバーを作成可能" ON members;
  DROP POLICY IF EXISTS "認証ユーザーはメンバーを更新可能" ON members;
  DROP POLICY IF EXISTS "Allow auth select members" ON members;
  DROP POLICY IF EXISTS "Allow auth insert members" ON members;
  DROP POLICY IF EXISTS "Allow auth update members" ON members;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Allow auth select members" ON members FOR SELECT TO authenticated USING (true);
-- Note: 'members' table might not have 'user_id' yet in some versions, but schema says it does.
-- If push fails, we need to check the actual columns.
CREATE POLICY "Allow auth insert members" ON members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth update members" ON members FOR UPDATE TO authenticated USING (true);

-- tasks
DO $$ BEGIN
  DROP POLICY IF EXISTS "認証ユーザーはタスクを閲覧可能" ON tasks;
  DROP POLICY IF EXISTS "認証ユーザーはタスクを作成可能" ON tasks;
  DROP POLICY IF EXISTS "認証ユーザーはタスクを更新可能" ON tasks;
  DROP POLICY IF EXISTS "認証ユーザーはタスクを削除可能" ON tasks;
  DROP POLICY IF EXISTS "Allow auth select tasks" ON tasks;
  DROP POLICY IF EXISTS "Allow auth insert tasks" ON tasks;
  DROP POLICY IF EXISTS "Allow auth update tasks" ON tasks;
  DROP POLICY IF EXISTS "Allow auth delete tasks" ON tasks;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Allow auth select tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth update tasks" ON tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow auth delete tasks" ON tasks FOR DELETE TO authenticated USING (true);

-- monthly_goals
DO $$ BEGIN
  DROP POLICY IF EXISTS "認証ユーザーは目標を閲覧可能" ON monthly_goals;
  DROP POLICY IF EXISTS "認証ユーザーは目標を作成可能" ON monthly_goals;
  DROP POLICY IF EXISTS "認証ユーザーは目標を更新可能" ON monthly_goals;
  DROP POLICY IF EXISTS "Allow auth select goals" ON monthly_goals;
  DROP POLICY IF EXISTS "Allow auth insert goals" ON monthly_goals;
  DROP POLICY IF EXISTS "Allow auth update goals" ON monthly_goals;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Allow auth select goals" ON monthly_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow auth insert goals" ON monthly_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow auth update goals" ON monthly_goals FOR UPDATE TO authenticated USING (true);

-- allowed_emails
DO $$ BEGIN
  DROP POLICY IF EXISTS "認証ユーザーは許可メール一覧を閲覧可能" ON allowed_emails;
  DROP POLICY IF EXISTS "Allow auth select allowed_emails" ON allowed_emails;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Allow auth select allowed_emails" ON allowed_emails FOR SELECT TO authenticated USING (true);
