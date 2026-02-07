'use client';

import { useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { calculatePercentage, getNowJST } from '@/lib/utils';
import type { DashboardSummary, MemberStats } from '@/lib/types';

export function AnalystInsight({ summary, memberStats }: { summary: DashboardSummary, memberStats: MemberStats[] }) {
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
