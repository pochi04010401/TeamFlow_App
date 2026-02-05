'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (mode === 'signup') {
        // メールがホワイトリストにあるか確認
        const { data: allowedEmail, error: checkError } = await supabase
          .from('allowed_emails')
          .select('email')
          .eq('email', email.toLowerCase())
          .single();

        if (checkError || !allowedEmail) {
          setError('このメールアドレスは招待されていません。管理者にお問い合わせください。');
          return;
        }

        // サインアップ
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        toast.success('アカウントを作成しました！', {
          description: 'ログインしてください。',
        });
        setMode('login');
      } else {
        // ログイン
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        toast.success('ログインしました！');
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません。');
        } else if (err.message.includes('User already registered')) {
          setError('このメールアドレスは既に登録されています。');
        } else {
          setError(err.message);
        }
      } else {
        setError('認証に失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-premium flex items-center justify-center shadow-glow">
            <span className="text-2xl font-bold text-white">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-dark-100">TeamFlow</h1>
          <p className="text-dark-400 mt-1">チーム管理をもっとスマートに</p>
        </div>

        {/* フォーム */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* エラー表示 */}
            {error && (
              <div className="p-4 rounded-lg bg-accent-danger/10 border border-accent-danger/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-accent-danger">{error}</p>
              </div>
            )}

            {/* メールアドレス */}
            <div>
              <label className="label">メールアドレス</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="input pl-11"
                  required
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label className="label">パスワード</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'login' ? 'ログイン中...' : 'アカウント作成中...'}
                </>
              ) : (
                mode === 'login' ? 'ログイン' : 'アカウント作成'
              )}
            </button>
          </form>

          {/* モード切り替え */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="text-sm text-accent-primary hover:underline"
            >
              {mode === 'login' 
                ? '招待されている方はこちらからアカウント作成' 
                : 'すでにアカウントをお持ちの方'}
            </button>
          </div>
        </div>

        {/* 注意書き */}
        <p className="text-xs text-dark-500 text-center mt-4">
          このアプリは招待制です。<br />
          招待を受けたメールアドレスでのみアカウント作成できます。
        </p>

        {/* バージョン表示 (v1.4) */}
        <div className="flex justify-center mt-8 opacity-20">
          <span className="text-[10px] font-mono text-dark-500">TeamFlow v1.4</span>
        </div>
      </div>
    </div>
  );
}
