'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Target, Calendar, ArrowUpRight, 
  ArrowDownRight, Zap, DollarSign, Award, ChevronDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatNumber, getCurrentMonth, getNowJST, formatDate } from '@/lib/utils';
import type { Task, Member, MonthlyGoal } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';

const COLORS = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4', '#957DAD', '#D4A5A5'];

export function AnalyticsView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'6months' | 'year' | 'all'>('6months');

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data: membersData } = await supabase.from('members').select('*');
      const { data: tasksData } = await supabase.from('tasks').select('*, member:members(*)').neq('status', 'cancelled');
      const { data: goalsData } = await supabase.from('monthly_goals').select('*').order('month', { ascending: false });

      setMembers(membersData || []);
      setTasks(tasksData as Task[] || []);
      setGoals(goalsData || []);
    } catch (err) {
      console.error(err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 1. 月次売上推移データ
  const monthlyData = useMemo(() => {
    const data: { [key: string]: { month: string; amount: number; target: number; points: number } } = {};
    
    // 過去6ヶ月〜12ヶ月の枠を作成
    const now = getNowJST();
    const monthsToShow = timeRange === '6months' ? 6 : timeRange === 'year' ? 12 : 24;

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      data[mStr] = { month: mStr.split('-')[1] + '月', amount: 0, target: 0, points: 0 };
    }

    // 目標値をセット
    goals.forEach(g => {
      if (data[g.month]) data[g.month].target = g.target_amount / 1000;
    });

    // 実績値を集計
    tasks.filter(t => t.status === 'completed' && t.completed_at).forEach(t => {
      const date = new Date(t.completed_at!);
      const mStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (data[mStr]) {
        data[mStr].amount += (t.amount || 0) / 1000;
        data[mStr].points += (t.points || 0);
      }
    });

    return Object.values(data);
  }, [tasks, goals, timeRange]);

  // 2. メンバー別貢献度 (シェア)
  const memberShareData = useMemo(() => {
    return members.map(m => {
      const memberTasks = tasks.filter(t => t.member_id === m.id && t.status === 'completed');
      const totalAmount = memberTasks.reduce((sum, t) => sum + (t.amount || 0), 0);
      return { name: m.name, value: totalAmount / 1000, color: m.color };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [tasks, members]);

  // 3. 各種KPI
  const stats = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const thisMonthTasks = tasks.filter(t => {
      const date = t.completed_at ? new Date(t.completed_at) : null;
      if (!date) return false;
      const mStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return mStr === currentMonth;
    });

    const totalRevenue = thisMonthTasks.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgTaskPrice = thisMonthTasks.length > 0 ? totalRevenue / thisMonthTasks.length : 0;
    
    // 前月比の計算
    const lastMonth = new Date(getNowJST().getFullYear(), getNowJST().getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthRevenue = tasks.filter(t => {
      const date = t.completed_at ? new Date(t.completed_at) : null;
      if (!date) return false;
      const mStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return mStr === lastMonthStr;
    }).reduce((sum, t) => sum + (t.amount || 0), 0);

    const growth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    return {
      thisMonthRevenue: totalRevenue / 1000,
      avgTaskPrice: avgTaskPrice / 1000,
      growth,
      completedCount: thisMonthTasks.length
    };
  }, [tasks]);

  if (loading) return <div className="p-20 text-center animate-pulse text-dark-400">データ分析中...</div>;
  if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6 animate-fade-in pb-32 px-2">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-dark-100">チーム分析</h1>
          <p className="text-xs text-dark-500 mt-1">過去のトレンドと貢献度を可視化</p>
        </div>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-dark-200 focus:outline-none"
        >
          <option value="6months">直近6ヶ月</option>
          <option value="year">1年間</option>
          <option value="all">全期間</option>
        </select>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-accent-success/10"><TrendingUp className="w-4 h-4 text-accent-success" /></div>
            {stats.growth !== 0 && (
              <span className={`text-[10px] font-bold flex items-center ${stats.growth > 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {stats.growth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(stats.growth).toFixed(1)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] text-dark-500 font-bold uppercase tracking-wider">今月の売上</p>
            <p className="text-lg font-black text-dark-100">{formatNumber(stats.thisMonthRevenue)}<span className="text-xs ml-0.5">千円</span></p>
          </div>
        </div>
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-accent-primary/10"><Target className="w-4 h-4 text-accent-primary" /></div>
            <span className="text-[10px] text-dark-500 font-bold">案件数: {stats.completedCount}</span>
          </div>
          <div>
            <p className="text-[10px] text-dark-500 font-bold uppercase tracking-wider">平均案件単価</p>
            <p className="text-lg font-black text-dark-100">{formatNumber(Math.round(stats.avgTaskPrice))}<span className="text-xs ml-0.5">千円</span></p>
          </div>
        </div>
      </div>

      {/* 売上推移グラフ */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-dark-200 mb-6 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent-secondary" />
          売上トレンド (千円単位)
        </h3>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}M`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Area type="monotone" dataKey="amount" name="売上実績" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              <Line type="monotone" dataKey="target" name="目標値" stroke="#64748b" strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* メンバー別シェア */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-dark-200 mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-accent-primary" />
            売上貢献度シェア
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberShareData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memberShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${formatNumber(value)} 千円`, '売上']}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {memberShareData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-[10px] text-dark-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ポイント貢献 */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-dark-200 mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-warning" />
            月次ポイント推移
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="points" name="ポイント" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* のののアドバイス */}
      <div className="card p-5 bg-gradient-to-br from-accent-primary/10 to-transparent border-accent-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-dark-700 flex-shrink-0 flex items-center justify-center text-2xl">👻</div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-accent-primary uppercase tracking-widest">のののアドバイス</h4>
            <p className="text-sm text-dark-200 leading-relaxed italic">
              {stats.growth > 0 
                ? "先月より売上が伸びてるよ！この調子でガンガン行こう！🚀✨" 
                : "ちょっとお疲れかな？無理せず、まずは1件ずつ着実に完了させていこうね！👩‍⚕️💖"}
              {stats.avgTaskPrice > 100 && " 平均単価が高くてすごいね！プロの仕事って感じだよ💎"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
