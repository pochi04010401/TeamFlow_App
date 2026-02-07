'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Zap, Activity, CheckCircle2, Trophy, Download, Calendar, Crown, Sparkles, MessageSquare, Lightbulb } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  formatCurrency, 
  formatNumber, 
  calculatePercentage, 
  getCurrentMonth,
  formatDateJP,
  exportTasksToCSV,
  fireConfetti,
  getNowJST,
  formatDate
} from '@/lib/utils';
import type { Task, DashboardSummary, MemberStats, Member, RankingPeriod } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';
import { MemberFilter } from './MemberFilter';
import { toast } from 'sonner';

// ランキング期間切り替え
function RankingPeriodToggle({
  period,
  onToggle,
}: {
  period: RankingPeriod;
  onToggle: (period: RankingPeriod) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-dark-700/50 text-xs">
      <button
        onClick={() => onToggle('monthly')}
        className={`px-3 py-1 rounded-md transition-all duration-200 ${
          period === 'monthly' ? 'bg-accent-warning/20 text-accent-warning' : 'text-dark-400 hover:text-dark-300'
        }`}
      >
        月間
      </button>
      <button
        onClick={() => onToggle('yearly')}
        className={`px-3 py-1 rounded-md transition-all duration-200 ${
          period === 'yearly' ? 'bg-accent-warning/20 text-accent-warning' : 'text-dark-400 hover:text-dark-300'
        }`}
      >
        年間
      </button>
    </div>
  );
}

// メーターコンポーネント (v1.44)
function Meter({ 
  label, 
  completed, 
  pending, 
  target,
  formatValue,
  color = 'primary'
}: { 
  label: string;
  completed: number;
  pending: number;
  target: number;
  formatValue: (n: number) => string;
  color?: 'primary' | 'secondary';
}) {
  const completedPercent = calculatePercentage(completed, target);
  const pendingPercent = calculatePercentage(completed + pending, target);
  const isGoalReached = completedPercent >= 100;

  useEffect(() => {
    if (isGoalReached) {
      const timer = setTimeout(() => fireConfetti(), 1000);
      return () => clearTimeout(timer);
    }
  }, [isGoalReached, completed]);

  return (
    <div className={`card p-5 transition-all duration-500 ${isGoalReached ? 'border-accent-warning shadow-glow-sm bg-accent-warning/5' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-black text-dark-400 uppercase tracking-widest">{label} {label === '売上' && '(千円)'}</h3>
            {isGoalReached && <Crown className="w-4 h-4 text-accent-warning animate-bounce" />}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-black text-dark-500">目標:</span>
            <span className="text-xl font-black text-dark-100 tracking-tight">{formatValue(target)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            {isGoalReached && <Sparkles className="w-4 h-4 text-accent-warning animate-pulse" />}
            <span className={`text-3xl font-black leading-none ${isGoalReached ? 'text-accent-warning' : 'text-dark-100'}`}>
              {completedPercent}
            </span>
            <span className="text-xs font-black text-dark-500">%</span>
          </div>
          <p className="text-[9px] font-bold text-dark-500 uppercase tracking-tighter mt-1">達成率</p>
        </div>
      </div>

      <div className="relative h-5 bg-dark-700 rounded-full overflow-hidden mb-4 border border-white/5 shadow-inner-dark">
        <div className="absolute top-0 left-0 h-full meter-pending transition-all duration-700 ease-out opacity-40" style={{ width: `${Math.min(pendingPercent, 100)}%` }} />
        <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isGoalReached ? 'bg-gradient-to-r from-accent-warning to-yellow-300' : 'meter-completed shadow-glow-sm'}`} style={{ width: `${Math.min(completedPercent, 100)}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-dark-500 uppercase tracking-widest mb-0.5">確定</span>
          <span className="text-sm font-black text-accent-success">{formatValue(completed)}</span>
        </div>
        <div className="flex flex-col text-right border-l border-dark-700 pl-4">
          <span className="text-[9px] font-bold text-dark-500 uppercase tracking-widest mb-0.5">見込み込</span>
          <span className="text-sm font-black text-accent-warning">{formatValue(completed + pending)}</span>
        </div>
      </div>
    </div>
  );
}

// v1.54: 見習いアナリストの現状分析
function AnalystInsight({ summary, memberStats }: { summary: DashboardSummary, memberStats: MemberStats[] }) {
  const insight = useMemo(() => {
    const revenuePercent = calculatePercentage(summary.completedAmount, summary.targetAmount);
    const pointPercent = calculatePercentage(summary.completedPoints, summary.targetPoints);
    const topMember = [...memberStats].sort((a, b) => b.completedAmount - a.completedAmount)[0];
    const now = getNowJST();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);

    let text = `現在、${now.getMonth() + 1}月の営業日数の約${monthProgress}%が経過しました。現状のデータを分析します。📊\n\n`;

    if (revenuePercent >= monthProgress) {
      text += `売上達成率は${revenuePercent}%と、カレンダーの進捗を上回る非常に良いペースです。目標達成の可能性が高いでしょう。🚀✨`;
    } else {
      text += `売上達成率は${revenuePercent}%で、目標に対してやや遅れが見られます。後半の巻き返しに期待しましょう。💪`;
    }

    if (topMember && topMember.completedAmount > 0) {
      text += `\n\n現在の貢献度トップは${topMember.member.name}さんです。チーム全体の売上の多くを牽引しています。`;
    }

    if (pointPercent > 80) {
      text += `\nまた、ポイント達成率が${pointPercent}%を超えており、チームの質的な活動も非常に活発であると評価できます。🧚‍♀️`;
    }

    return text;
  }, [summary, memberStats]);

  return (
    <div className="card p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-glow">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-dark-100">見習いアナリストの現状分析</h3>
          <p className="text-[10px] text-dark-400 font-bold uppercase tracking-widest">Progress Audit</p>
        </div>
      </div>
      <p className="text-sm text-dark-200 leading-relaxed whitespace-pre-wrap font-medium relative z-10">
        {insight}
      </p>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
    </div>
  );
}

// v1.54: 本日のビジネスコラム
const BUSINESS_COLUMNS = [
  "生産性を高めるには「ポモドーロ・テクニック」が有効です。25分集中して5分休むリズムを試してみてください。⏱",
  "良質な睡眠は最高のビジネススキルです。7時間以上の睡眠を確保することで、判断力と創造性が維持されます。🛌",
  "「結論から話す」PREP法を意識するだけで、チーム内のコミュニケーションコストは劇的に下がります。🗣",
  "マルチタスクは脳の効率を40%低下させると言われています。一つの作業を終えてから次へ進みましょう。🎯",
  "デスクに観葉植物を置くと、ストレスが軽減され、集中力が15%向上するという研究結果があります。🌱",
  "完璧を目指すより、まずは期限を守る。スピードは信頼に直結する最大の武器です。🚀",
  "週に一度、振り返りの時間（1人合宿）を作ることで、長期的な目標とのズレを修正できます。🧭",
  "「No」を言う勇気を持ちましょう。重要でないタスクを断ることで、本当に価値のある仕事に集中できます。🛡",
  "メールやチャットの通知をオフにする時間を作りましょう。深い集中（ディープワーク）が成果を生みます。🤫",
  "ポジティブなフィードバックは、チームの生産性を向上させる最も安価で効果的な投資です。👏",
  "散歩をしながら考えると、座っている時よりも創造的なアイデアが出やすくなります。👟",
  "タスクを記録する行為そのものが、脳のワーキングメモリを解放し、ストレスを軽減させます。📝",
  "失敗を「経験値」と呼び替えましょう。挑戦の数だけ、チームは強くなります。💎",
  "水分補給は脳のパフォーマンスに直結します。一日に1.5〜2リットルの水を目安に。🚰",
  "感謝の言葉は脳内報酬系を活性化させます。「ありがとう」を惜しみなく伝えましょう。✨",
  "5分以内に終わるタスクは、後回しにせず「今すぐ」やってしまいましょう。🧹",
  "朝一番に最も困難なタスク（カエルを食べる）を終わらせると、一日の充実感が変わります。🐸",
  "目標設定はSMARTの法則（具体的、測定可能、達成可能、関連性、期限）を意識しましょう。📈",
  "定期的なデジタルデトックスは、脳の疲労をリセットし、新しい視点を与えてくれます。📵",
  "整理整頓されたPCデスクトップは、心の整理整頓にも繋がります。不要なファイルは削除を。🗑",
  "他人の意見を批判する前に、まずは「YES, AND」で受け止める文化がイノベーションを生みます。💡",
  "健康管理も仕事の一部です。無理な残業よりも、継続可能なペースを維持しましょう。🌿",
  "新しいスキルの習得には、一日15分の積み重ねが、一年後には大きな差になります。📚",
  "笑顔は周囲に伝染します。リーダーの機嫌が、チームの生産性を左右することを忘れずに。😊",
  "「とりあえずやってみる」プロトタイプ思考が、不確実な時代の最速の正解への道です。🔨",
  "優先順位の判断に迷ったら「それはお客様の利益になるか？」に立ち返りましょう。🤝",
  "困難な問題に直面した時こそ、ユーモアを。心の余裕が解決策を引き寄せます。🎭",
  "デスクの高さや椅子の設定を見直すだけで、長時間の作業効率が劇的に改善します。💺",
  "情報の共有を惜しまない。オープンな情報文化が、個人の判断スピードを加速させます。📡",
  "自分の限界を知ることもプロの仕事です。無理な時は早めに周囲にアラートを出しましょう。🔔",
  "「今日も一日お疲れ様でした！」と自分に言う習慣が、明日への活力になります。🌟"
];

function BusinessColumn() {
  const column = useMemo(() => {
    const day = getNowJST().getDate();
    return BUSINESS_COLUMNS[(day - 1) % BUSINESS_COLUMNS.length];
  }, []);

  return (
    <div className="card p-5 border-dashed border-dark-600 bg-dark-800/30">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-accent-warning" />
        <h4 className="text-[10px] font-black text-dark-400 uppercase tracking-widest">本日のビジネス Tips</h4>
      </div>
      <p className="text-xs text-dark-300 font-medium leading-relaxed italic">
        「{column}」
      </p>
    </div>
  );
}

// 月間完了集計カード
function MonthlyCompletionCard({ count, totalAmount }: { count: number; totalAmount: number; }) {
  const now = getNowJST();
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-accent-primary" />
        </div>
        <div>
          <h3 className="font-medium text-dark-200">今月の完了</h3>
          <p className="text-xs text-dark-500">{now.getFullYear()}年{now.getMonth() + 1}月</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-lg bg-dark-700/30">
          <p className="text-2xl font-bold text-accent-success">{count}</p>
          <p className="text-xs text-dark-400">完了タスク</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-dark-700/30">
          <p className="text-lg font-bold text-accent-success">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-dark-400">完了金額 (千円)</p>
        </div>
      </div>
    </div>
  );
}

// メンバーランキング
function MemberRanking({ stats, yearlyStats, type, period, onPeriodChange }: { stats: MemberStats[]; yearlyStats: MemberStats[]; type: 'amount' | 'points'; period: RankingPeriod; onPeriodChange: (period: RankingPeriod) => void; }) {
  const targetStats = period === 'monthly' ? stats : yearlyStats;
  const sortedStats = useMemo(() => {
    return [...targetStats].sort((a, b) => type === 'amount' ? b.completedAmount - a.completedAmount : b.completedPoints - a.completedPoints);
  }, [targetStats, type]);
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-dark-200 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent-warning" />
          {type === 'amount' ? '売上ランキング' : 'ポイントランキング'}
        </h3>
        <RankingPeriodToggle period={period} onToggle={onPeriodChange} />
      </div>
      <div className="space-y-2">
        {sortedStats.slice(0, 5).map((stat, index) => (
          <div key={stat.member.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark-700/30">
            <span className="w-6 text-center">{index < 3 ? medals[index] : `${index + 1}`}</span>
            <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: stat.member.color }} />
            <span className="flex-1 text-dark-200 text-sm truncate">{stat.member.name}</span>
            <span className="text-sm font-medium text-accent-success">{type === 'amount' ? formatCurrency(stat.completedAmount) : `${formatNumber(stat.completedPoints)}pt`}</span>
          </div>
        ))}
        {sortedStats.length === 0 && <p className="text-dark-500 text-sm text-center py-2">データがありません</p>}
      </div>
    </div>
  );
}

// 最近のアクティビティ
function RecentActivity({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="font-medium text-dark-200 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-accent-primary" />最新アクティビティ</h3>
        <p className="text-dark-500 text-sm text-center py-4">まだ完了したタスクがありません</p>
      </div>
    );
  }
  return (
    <div className="card p-5">
      <h3 className="font-medium text-dark-200 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-accent-primary" />最新アクティビティ</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg animate-fade-in ${"completed" === task.status ? 'bg-dark-700/50' : 'bg-dark-700/30 border border-accent-warning/20'}`}>
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${"completed" === task.status ? 'text-accent-success' : 'text-accent-warning'}`} />
            <div className="flex-1 min-w-0">
              <p className={`truncate ${"completed" === task.status ? 'text-dark-200' : 'text-dark-100 font-medium'}`}>{task.title}</p>
              <p className="text-xs text-dark-500">{task.completed_at ? formatDateJP(task.completed_at) : '進行中'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-medium ${"completed" === task.status ? 'text-accent-success' : 'text-accent-warning'}`}>{formatCurrency(task.amount)}</p>
              <p className="text-xs text-dark-500">{task.points}pt</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// CSV出力ボタン
function CSVExportButton({ tasks }: { tasks: Task[] }) {
  const handleExport = () => {
    if (tasks.length === 0) { toast.error('エクスポートするタスクがありません'); return; }
    
    const headers = ['ID', 'タイトル', '金額', 'ポイント', '担当者', 'ステータス', '開始日', '終了日', '完了日', '作成日'];
    const rows = tasks.map(task => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      task.amount.toString(),
      task.points.toString(),
      task.member?.name || '',
      task.status === 'pending' ? '進行中' : task.status === 'completed' ? '完了' : task.status === 'cancelled' ? 'キャンセル' : '削除',
      task.start_date || task.scheduled_date || '',
      task.end_date || task.scheduled_date || '',
      task.completed_at || '',
      task.created_at
    ]);

    const bom = '\uFEFF';
    const csvContent = bom + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TeamFlow_AllTasks_${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('全てのタスクをCSV出力しました');
  };
  return (
    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-dark-300 hover:text-dark-100">
      <Download className="w-4 h-4" />
      <span className="text-sm">CSV出力</span>
    </button>
  );
}

// ローディング表示
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2].map(i => (
        <div key={i} className="card p-5">
          <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl skeleton" /><div className="space-y-2"><div className="h-4 w-20 skeleton rounded" /><div className="h-3 w-32 skeleton rounded" /></div></div>
          <div className="h-4 skeleton rounded-full mb-3" /><div className="flex justify-between"><div className="h-4 w-24 skeleton rounded" /><div className="h-4 w-24 skeleton rounded" /></div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [yearlyMemberStats, setYearlyMemberStats] = useState<MemberStats[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('monthly');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const currentMonth = getCurrentMonth();
      const now = getNowJST();
      const currentYear = now.getFullYear();

      const { data: goalsData } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('month', currentMonth);
      
      const goals = goalsData && goalsData.length > 0 ? goalsData[0] : null;

      const startOfMonth = `${currentMonth}-01`;
      const [y, m] = currentMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const endOfMonth = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;
      
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*, member:members(*)')
        .in('status', ['pending', 'completed'])
        .or(`start_date.lte.${endOfMonth},scheduled_date.lte.${endOfMonth}`)
        .or(`end_date.gte.${startOfMonth},scheduled_date.gte.${startOfMonth}`);
      
      if (tasksError) throw tasksError;

      const { data: rawAllTasks } = await supabase
        .from('tasks')
        .select('*, member:members(*)')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      const { data: yearlyTasks } = await supabase.from('tasks').select('*, member:members(*)').gte('completed_at', `${currentYear}-01-01`).lte('completed_at', `${currentYear}-12-31`).eq('status', 'completed');
      const { data: recentTasks } = await supabase.from('tasks').select('*').in('status', ['pending', 'completed']).order('completed_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).limit(5);
      const { data: membersData } = await supabase.from('members').select('*').order('created_at');
      
      const currentMonthTasks = (tasks || []).filter(t => {
        const start = t.start_date || t.scheduled_date;
        const end = t.end_date || t.scheduled_date;
        if (!start || !end) return false;
        return start <= endOfMonth && end >= startOfMonth;
      });

      const completedTasks = currentMonthTasks.filter(t => t.status === 'completed');
      const pendingTasks = currentMonthTasks.filter(t => t.status === 'pending');
      
      setSummary({
        completedAmount: completedTasks.reduce((sum, t) => sum + (t.amount || 0), 0),
        pendingAmount: pendingTasks.reduce((sum, t) => sum + (t.amount || 0), 0),
        completedPoints: completedTasks.reduce((sum, t) => sum + (t.points || 0), 0),
        pendingPoints: pendingTasks.reduce((sum, t) => sum + (t.points || 0), 0),
        targetAmount: goals?.target_amount || 10000000,
        targetPoints: goals?.target_points || 1000,
        recentActivities: recentTasks || [],
        monthlyCompletedCount: completedTasks.length,
      });

      setMemberStats((membersData || []).map(member => {
        const mTasks = currentMonthTasks.filter(t => t.member_id === member.id);
        const mCompleted = mTasks.filter(t => t.status === 'completed');
        return { 
          member, 
          totalAmount: mTasks.reduce((s, t) => s + (t.amount || 0), 0), 
          completedAmount: mCompleted.reduce((s, t) => s + (t.amount || 0), 0), 
          totalPoints: mTasks.reduce((s, t) => s + (t.points || 0), 0), 
          completedPoints: mCompleted.reduce((s, t) => s + (t.points || 0), 0), 
          taskCount: mTasks.length, 
          completedTaskCount: mCompleted.length 
        };
      }));

      setYearlyMemberStats((membersData || []).map(member => {
        const mTasks = yearlyTasks?.filter(t => t.member_id === member.id) || [];
        return { member, totalAmount: mTasks.reduce((s, t) => s + (t.amount || 0), 0), completedAmount: mTasks.reduce((s, t) => s + (t.amount || 0), 0), totalPoints: mTasks.reduce((s, t) => s + (t.points || 0), 0), completedPoints: mTasks.reduce((s, t) => s + (t.points || 0), 0), taskCount: mTasks.length, completedTaskCount: mTasks.length };
      }));
      setMembers(membersData || []);
      setAllTasks(rawAllTasks || []);
    } catch (err) { console.error(err); setError('データの取得に失敗しました'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const filteredSummary = useMemo(() => {
    if (!summary || !selectedMemberId) return summary;
    const stat = memberStats.find(s => s.member.id === selectedMemberId);
    if (!stat) return summary;
    return { ...summary, completedAmount: stat.completedAmount, pendingAmount: stat.totalAmount - stat.completedAmount, completedPoints: stat.completedPoints, pendingPoints: stat.totalPoints - stat.completedPoints, recentActivities: summary.recentActivities.filter(t => t.member_id === selectedMemberId), monthlyCompletedCount: stat.completedTaskCount };
  }, [summary, selectedMemberId, memberStats]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchDashboardData} />;
  if (!summary || !filteredSummary) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-32 px-2">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <MemberFilter members={members} selectedMemberId={selectedMemberId} onSelect={setSelectedMemberId} />
        </div>
        <CSVExportButton tasks={allTasks} />
      </div>

      <MonthlyCompletionCard count={filteredSummary.monthlyCompletedCount} totalAmount={filteredSummary.completedAmount} />
      <Meter label="売上" completed={filteredSummary.completedAmount} pending={filteredSummary.pendingAmount} target={filteredSummary.targetAmount} formatValue={formatCurrency} color="primary" />
      <Meter label="ポイント" completed={filteredSummary.completedPoints} pending={filteredSummary.pendingPoints} target={filteredSummary.targetPoints} formatValue={(n) => `${formatNumber(n)}pt`} color="secondary" />

      {!selectedMemberId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MemberRanking stats={memberStats} yearlyStats={yearlyMemberStats} type="amount" period={rankingPeriod} onPeriodChange={setRankingPeriod} />
          <MemberRanking stats={memberStats} yearlyStats={yearlyMemberStats} type="points" period={rankingPeriod} onPeriodChange={setRankingPeriod} />
        </div>
      )}

      <RecentActivity tasks={filteredSummary.recentActivities} />

      {/* v1.54: 見習いアナリストの現状分析 & 本日のビジネス Tips (ホームへ移動) */}
      <div className="space-y-6 pt-4 border-t border-dark-700/50">
        <AnalystInsight summary={summary} memberStats={memberStats} />
        <BusinessColumn />
      </div>

      <div className="flex justify-center pt-4 pb-8 opacity-20"><span className="text-[10px] font-mono text-dark-500">TeamFlow v1.54</span></div>
    </div>
  );
}
