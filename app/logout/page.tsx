import Link from 'next/link';
import { CheckCircle2, LogIn } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ログアウト完了 - TeamFlow',
};

export default function LogoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        {/* アイコン */}
        <div className="w-20 h-20 rounded-full bg-accent-success/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-accent-success" />
        </div>

        {/* メッセージ */}
        <h1 className="text-2xl font-bold text-dark-100 mb-2">
          ログアウトしました
        </h1>
        <p className="text-dark-400 mb-8">
          ご利用ありがとうございました。<br />
          またのご利用をお待ちしております。
        </p>

        {/* ログインボタン */}
        <Link
          href="/login"
          className="btn-primary inline-flex items-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          再度ログイン
        </Link>

        {/* ロゴ */}
        <div className="mt-12">
          <h2 className="text-xl font-bold bg-gradient-to-r from-accent-primary to-purple-400 bg-clip-text text-transparent">
            TeamFlow
          </h2>
          <p className="text-xs text-dark-500 mt-1">チーム管理アプリ</p>
        </div>
      </div>
    </div>
  );
}
