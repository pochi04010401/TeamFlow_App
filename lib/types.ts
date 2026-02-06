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

// タスクステータス
export type TaskStatus = 'pending' | 'completed';

// タスク (v1.1: start_date, end_date対応)
export interface Task {
  id: string;
  title: string;
  amount: number;
  points: number;
  member_id: string;
  status: TaskStatus;
  start_date: string;       // v1.1: 開始日
  end_date: string;         // v1.1: 終了日
  notes?: string;           // v1.7: メモ
  scheduled_date?: string;  // 後方互換性のため残す
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
  monthlyCompletedCount: number; // v1.2: 月間完了タスク数
}

// メンバー別集計 (v1.1)
export interface MemberStats {
  member: Member;
  totalAmount: number;
  completedAmount: number;
  totalPoints: number;
  completedPoints: number;
  taskCount: number;
  completedTaskCount: number;
}

// カレンダー表示用のタスク（メンバー情報付き）
export interface CalendarTask extends Task {
  member: Member;
}

// フォーム入力 (v1.1: start_date, end_date対応)
export interface TaskFormData {
  title: string;
  amount: number;
  points: number;
  member_id: string;
  start_date: string;
  end_date: string;
  notes: string;
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

// ビュータイプ (v1.1)
export type ViewMode = 'personal' | 'team';

// ランキング期間 (v1.2)
export type RankingPeriod = 'monthly' | 'yearly';

// カレンダー表示オプション (v1.2)
export interface CalendarDisplayOptions {
  hideCompleted: boolean;
}
