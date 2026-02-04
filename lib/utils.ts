import { type ClassValue, clsx } from 'clsx';

// クラス名を結合するユーティリティ
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// 日付を YYYY-MM-DD 形式にフォーマット
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

// 日付を日本語形式にフォーマット
export function formatDateJP(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

// 月を YYYY-MM 形式で取得
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// 金額をフォーマット（カンマ区切り）
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}

// 数値をフォーマット（カンマ区切り）
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}

// パーセンテージを計算
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((value / total) * 100), 100);
}

// 日付の配列を生成（今月の日付）
export function getMonthDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const lastDay = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= lastDay; day++) {
    dates.push(new Date(year, month - 1, day));
  }
  
  return dates;
}

// 今日の日付かどうかチェック
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

// 曜日を取得（日本語）
export function getDayOfWeek(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[d.getDay()];
}

// エラーメッセージを取得
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '予期せぬエラーが発生しました';
}

// デバウンス関数
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 紙吹雪を発射
export async function fireConfetti(): Promise<void> {
  const confetti = (await import('canvas-confetti')).default;
  
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

// パステルカラーのセット（8人分）
export const MEMBER_COLORS = [
  '#FFB3BA', // パステルピンク
  '#BAFFC9', // パステルグリーン
  '#BAE1FF', // パステルブルー
  '#FFFFBA', // パステルイエロー
  '#FFDFBA', // パステルオレンジ
  '#E0BBE4', // パステルパープル
  '#957DAD', // ラベンダー
  '#D4A5A5', // ダスティローズ
] as const;

// カラーからテキストカラーを決定（コントラスト用）
export function getContrastColor(hexColor: string): string {
  // #を除去
  const hex = hexColor.replace('#', '');
  
  // RGBに変換
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // 輝度を計算
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // 輝度が高い場合は暗いテキスト、低い場合は明るいテキスト
  return luminance > 0.5 ? '#1e293b' : '#f8fafc';
}
