-- ============================================
-- TeamFlow Database Schema for Supabase
-- Version 1.1
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- テーブル作成
-- ============================================

-- メンバー管理
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL, -- 16進数カラーコード
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- タスク・売上・ポイント (v1.1: start_date, end_date追加)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amount BIGINT DEFAULT 0,
  points INTEGER DEFAULT 0,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  start_date DATE NOT NULL,           -- v1.1: 開始日
  end_date DATE NOT NULL,             -- v1.1: 終了日
  scheduled_date DATE,                -- 後方互換性のため残す
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 月間目標
CREATE TABLE monthly_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month TEXT NOT NULL UNIQUE, -- YYYY-MM形式
  target_amount BIGINT DEFAULT 0,
  target_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 招待制ホワイトリスト
CREATE TABLE allowed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- インデックス作成（パフォーマンス最適化）
-- ============================================

CREATE INDEX idx_tasks_member_id ON tasks(member_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_start_date ON tasks(start_date);
CREATE INDEX idx_tasks_end_date ON tasks(end_date);
CREATE INDEX idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX idx_monthly_goals_month ON monthly_goals(month);
CREATE INDEX idx_members_user_id ON members(user_id);

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

-- RLSを有効化
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- membersテーブルのポリシー
CREATE POLICY "認証ユーザーはメンバーを閲覧可能" ON members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "認証ユーザーはメンバーを作成可能" ON members
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "認証ユーザーはメンバーを更新可能" ON members
  FOR UPDATE TO authenticated USING (true);

-- tasksテーブルのポリシー
CREATE POLICY "認証ユーザーはタスクを閲覧可能" ON tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "認証ユーザーはタスクを作成可能" ON tasks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "認証ユーザーはタスクを更新可能" ON tasks
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "認証ユーザーはタスクを削除可能" ON tasks
  FOR DELETE TO authenticated USING (true);

-- monthly_goalsテーブルのポリシー
CREATE POLICY "認証ユーザーは目標を閲覧可能" ON monthly_goals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "認証ユーザーは目標を作成可能" ON monthly_goals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "認証ユーザーは目標を更新可能" ON monthly_goals
  FOR UPDATE TO authenticated USING (true);

-- allowed_emailsテーブルのポリシー（閲覧のみ許可）
CREATE POLICY "認証ユーザーは許可メール一覧を閲覧可能" ON allowed_emails
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- サインアップ制限のためのトリガー関数
-- ============================================

CREATE OR REPLACE FUNCTION check_email_allowed()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM allowed_emails WHERE email = NEW.email
  ) THEN
    RAISE EXCEPTION 'このメールアドレスは招待されていません';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersテーブルへのトリガー（Supabaseダッシュボードで設定が必要な場合あり）
-- CREATE TRIGGER check_email_before_signup
--   BEFORE INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION check_email_allowed();

-- ============================================
-- 初期データ（デモ用）
-- ============================================

-- 8人分のデフォルトメンバー（パステルカラー）
INSERT INTO members (name, color) VALUES
  ('田中さん', '#FFB3BA'),  -- パステルピンク
  ('佐藤さん', '#BAFFC9'),  -- パステルグリーン
  ('鈴木さん', '#BAE1FF'),  -- パステルブルー
  ('高橋さん', '#FFFFBA'),  -- パステルイエロー
  ('伊藤さん', '#FFDFbA'),  -- パステルオレンジ
  ('渡辺さん', '#E0BBE4'),  -- パステルパープル
  ('山本さん', '#957DAD'),  -- ラベンダー
  ('中村さん', '#D4A5A5');  -- ダスティローズ

-- 今月の目標サンプル
INSERT INTO monthly_goals (month, target_amount, target_points) VALUES
  (TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 10000000, 1000);

-- 許可メールリスト（実際のメールに置き換えてください）
INSERT INTO allowed_emails (email) VALUES
  ('admin@example.com'),
  ('member1@example.com'),
  ('member2@example.com');
