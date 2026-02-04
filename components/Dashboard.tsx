'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  formatCurrency, 
  formatNumber, 
  calculatePercentage, 
  getCurrentMonth,
  formatDateJP
} from '@/lib/utils';
import type { Task, MonthlyGoal, DashboardSummary } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';

// メーターコンポーネント
function Meter({ 
  label, 
  icon: Icon,
  completed, 
  pending, 
  target,
  formatValue,
  color = 'primary'
}: { 
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: number;
  pending: number;
  target: number;
  formatValue: (n: number) => string;
  color?: 'primary' | 'secondary';
}) {
  const completedPercent = calculatePercentage(completed, target);
  const pendingPercent = calculatePercentage(completed + pending, target);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          color === 'primary' ? 'bg-accent-success/20' : 'bg-accent-secondary/20'
        }`}>
          <Icon className={`w-5 h-5 ${
            color === 'primary' ? 'text-accent-success' : 'text-accent-secondary'
          }`} />
        </div>
        <div>
          <h3 className="font-medium text-dark-200">{label}</h3>
          <p className="text-sm text-dark-400">目標: {formatValue(target)}</p>
        </div>
      </div>

      {/* メーターバー */}
      <div className="relative h-4 bg-dark-700 rounded-full overflow-hidden mb-3">
        {/* 見込み（pending）バー */}
        <div 
          className="absolute top-0 left-0 h-full meter-pending transition-all duration-700 ease-out opacity-60"
          style={{ width: `${pendingPercent}%` }}
        />
        {/* 確定（completed）バー */}
        <div 
          className="absolute top-0 left-0 h-full meter-completed transition-all duration-700 ease-out"
          style={{ width: `${completedPercent}%` }}
        />
      </div>

      {/* 数値表示 */}
      <div className="flex justify-between text-sm">
        <div>
          <span className="text-accent-success font-medium">{formatValue(completed)}</span>
          <span className="text-dark-500 ml-1">確定</span>
        </div>
        <div>
          <span className="text-accent-warning font-medium">{formatValue(pending)}</span>
          <span className="text-dark-500 ml-1">見込み</span>
        </div>
      </div>
    </div>
  );
}

// 最近のアクティビティ
function RecentActivity({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="font-medium text-dark-200 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent-primary" />
          最新アクティビティ
        </h3>
        <p className="text-dark-500 text-sm text-center py-4">
          まだ完了したタスクがありません
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-medium text-dark-200 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-accent-primary" />
        最新アクティビティ
      </h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div 
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 animate-fade-in"
          >
            <CheckCircle2 className="w-5 h-5 text-accent-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-dark-200 truncate">{task.title}</p>
              <p className="text-xs text-dark-500">
                {task.completed_at ? formatDateJP(task.completed_at) : ''}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm text-accent-success font-medium">
                {formatCurrency(task.amount)}
              </p>
              <p className="text-xs text-dark-500">{task.points}pt</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ローディング表示
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="space-y-2">
            <div className="h-4 w-20 skeleton rounded" />
            <div className="h-3 w-32 skeleton rounded" />
          </div>
        </div>
        <div className="h-4 skeleton rounded-full mb-3" />
        <div className="flex justify-between">
          <div className="h-4 w-24 skeleton rounded" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>
      </div>
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="space-y-2">
            <div className="h-4 w-20 skeleton rounded" />
            <div className="h-3 w-32 skeleton rounded" />
          </div>
        </div>
        <div className="h-4 skeleton rounded-full mb-3" />
        <div className="flex justify-between">
          <div className="h-4 w-24 skeleton rounded" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const currentMonth = getCurrentMonth();

      // 月間目標を取得
      const { data: goals, error: goalsError } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('month', currentMonth)
        .single();

      if (goalsError && goalsError.code !== 'PGRST116') {
        throw goalsError;
      }

      // 今月のタスクを取得
      const startOfMonth = `${currentMonth}-01`;
      const endOfMonth = new Date(
        parseInt(currentMonth.split('-')[0]), 
        parseInt(currentMonth.split('-')[1]), 
        0
      ).toISOString().split('T')[0];

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .gte('scheduled_date', startOfMonth)
        .lte('scheduled_date', endOfMonth);

      if (tasksError) throw tasksError;

      // 最近の完了タスクを取得
      const { data: recentTasks, error: recentError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(3);

      if (recentError) throw recentError;

      // サマリーを計算
      const completedTasks = tasks?.filter(t => t.status === 'completed') || [];
      const pendingTasks = tasks?.filter(t => t.status === 'pending') || [];

      const completedAmount = completedTasks.reduce((sum, t) => sum + (t.amount || 0), 0);
      const pendingAmount = pendingTasks.reduce((sum, t) => sum + (t.amount || 0), 0);
      const completedPoints = completedTasks.reduce((sum, t) => sum + (t.points || 0), 0);
      const pendingPoints = pendingTasks.reduce((sum, t) => sum + (t.points || 0), 0);

      setSummary({
        completedAmount,
        pendingAmount,
        completedPoints,
        pendingPoints,
        targetAmount: goals?.target_amount || 10000000,
        targetPoints: goals?.target_points || 1000,
        recentActivities: recentTasks || [],
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchDashboardData} />;
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 売上メーター */}
      <Meter
        label="売上"
        icon={TrendingUp}
        completed={summary.completedAmount}
        pending={summary.pendingAmount}
        target={summary.targetAmount}
        formatValue={formatCurrency}
        color="primary"
      />

      {/* ポイントメーター */}
      <Meter
        label="ポイント"
        icon={Zap}
        completed={summary.completedPoints}
        pending={summary.pendingPoints}
        target={summary.targetPoints}
        formatValue={(n) => `${formatNumber(n)}pt`}
        color="secondary"
      />

      {/* 最近のアクティビティ */}
      <RecentActivity tasks={summary.recentActivities} />
    </div>
  );
}
