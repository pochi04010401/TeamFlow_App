// TypeScript型定義

// メンバー
export interface Member {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  avatar_url?: string;
  created_at: string;
}

// タスク
export interface Task {
  id: string;
  title: string;
  amount: number;
  points: number;
  member_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  scheduled_date: string;
  completed_at?: string;
  created_at: string;
  // Joinしたメンバー情報
  member?: Member;
}

// 月間目標
export interface MonthlyGoal {
  id: string;
  month: string;
  target_amount: number;
  target_points: number;
  created_at?: string;
}

// 許可メール
export interface AllowedEmail {
  id: string;
  email: string;
  created_at: string;
}

// ダッシュボードのサマリー
export interface DashboardSummary {
  completedAmount: number;
  pendingAmount: number;
  completedPoints: number;
  pendingPoints: number;
  targetAmount: number;
  targetPoints: number;
  recentActivities: Task[];
}

// カレンダー表示用のタスク（メンバー情報付き）
export interface CalendarTask extends Task {
  member: Member;
}

// フォーム入力
export interface TaskFormData {
  title: string;
  amount: number;
  points: number;
  member_id: string;
  scheduled_date: string;
}

// APIレスポンス
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// 認証ユーザー
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

// ナビゲーションアイテム
export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
