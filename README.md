# TeamFlow - チーム管理一元化Webアプリ

チーム8名のタスク・売上・スケジュールをスマホで一元管理できるWebアプリケーション。

## ✨ 主な機能

- 📊 **ダッシュボード**: 売上・ポイントメーターで目標達成度を可視化
- 📅 **チームカレンダー**: メンバー別の色分けでスケジュールを一覧表示
- ✏️ **タスク登録**: スマホ最適化された入力フォーム
- 🎉 **完了エフェクト**: タスク完了時の紙吹雪演出
- 🔐 **招待制ログイン**: ホワイトリストによるアクセス制限
- 📱 **PWA対応**: ホーム画面に追加してネイティブアプリのように使用可能

### v1.1 新機能 🆕

- ✏️ **タスク再編集**: タスクをタップして全項目を編集・保存可能
- 📅 **期間対応**: タスクに開始日(`start_date`)と終了日(`end_date`)を設定可能
- 🎯 **残タスク優先表示**: 進行中タスクをメインに、完了済みは透過表示
- 🏆 **担当者別ランキング**: ダッシュボードにメンバー別売上・ポイントランキング
- 🔄 **ビュー切り替え**: 「個人/全体」トグルボタンで表示を切り替え
- ⏳ **進行中リスト**: `/pending` で進行中タスクのみを一覧表示
- 📤 **CSV出力**: 全タスクデータをCSVでエクスポート
- 👋 **ログアウト画面**: `/logout` でサンクスページを表示

## 🛠 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📦 セットアップ手順

### 1. 依存パッケージのインストール

```bash
cd TeamFlow_App
npm install
```

### 2. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下の情報を取得:
   - Project URL
   - anon/public API Key

### 3. 環境変数の設定

`.env.local` ファイルをプロジェクトルートに作成:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. データベースのセットアップ

Supabase ダッシュボードの SQL Editor で `schema.sql` の内容を実行:

1. Supabase ダッシュボードにログイン
2. 左メニューから「SQL Editor」を選択
3. `schema.sql` の内容をコピー＆ペースト
4. 「Run」ボタンで実行

### 5. 許可メールリストの更新

`schema.sql` の最後にある `allowed_emails` テーブルのINSERT文を、実際に招待するメールアドレスに置き換えてください。

```sql
INSERT INTO allowed_emails (email) VALUES
  ('your-email@example.com'),
  ('teammate@example.com');
```

### 6. Supabase Auth の設定

1. Supabase ダッシュボードで「Authentication」→「Providers」
2. 「Email」を有効化
3. 「Confirm email」を無効にする（招待制のため）

### 7. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリにアクセス

## 📱 PWA としてインストール

1. スマホのブラウザでアプリにアクセス
2. ブラウザメニューから「ホーム画面に追加」を選択
3. ネイティブアプリのように起動できます

## 📂 プロジェクト構造

```
TeamFlow_App/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx             # ダッシュボード
│   ├── login/page.tsx       # ログインページ
│   ├── logout/page.tsx      # ログアウト完了ページ (v1.1)
│   ├── schedule/page.tsx    # チームカレンダー
│   ├── pending/page.tsx     # 進行中タスク一覧 (v1.1)
│   ├── input/page.tsx       # タスク登録
│   └── globals.css          # グローバルスタイル
├── components/
│   ├── ui/                  # UIコンポーネント
│   ├── Dashboard.tsx        # ダッシュボードコンポーネント
│   ├── TeamCalendar.tsx     # カレンダーコンポーネント
│   ├── TaskForm.tsx         # タスク登録フォーム
│   ├── TaskEditModal.tsx    # タスク編集モーダル (v1.1)
│   ├── PendingTasks.tsx     # 進行中タスク一覧 (v1.1)
│   ├── Navigation.tsx       # ナビゲーション
│   ├── ErrorBoundary.tsx    # エラーバウンダリ
│   └── Providers.tsx        # プロバイダー
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Supabaseクライアント
│   │   └── server.ts        # サーバー用クライアント
│   ├── types.ts             # TypeScript型定義
│   └── utils.ts             # ユーティリティ関数
├── public/
│   ├── manifest.json        # PWAマニフェスト
│   ├── sw.js                # サービスワーカー
│   └── icons/               # アプリアイコン
├── schema.sql               # データベーススキーマ
├── tailwind.config.ts       # Tailwind設定
└── README.md
```

## 🎨 カスタマイズ

### メンバーカラーの変更

`schema.sql` の members テーブルのINSERT文でカラーコードを変更できます。

### 目標値の設定

Supabase ダッシュボードの Table Editor から `monthly_goals` テーブルを編集してください。

## 🔧 トラブルシューティング

### ログインできない

- `allowed_emails` テーブルにメールアドレスが登録されているか確認
- Supabase の Auth 設定で Email プロバイダーが有効か確認

### データが表示されない

- RLS ポリシーが正しく設定されているか確認
- Supabase の接続情報（URL, API Key）が正しいか確認

---

## 🗄️ v1.1 データベースマイグレーション

既存のデータベースを v1.1 にアップグレードする場合は、以下のSQLを実行してください。

### tasks テーブルに `start_date`, `end_date` カラムを追加

```sql
-- ============================================
-- TeamFlow v1.1 Migration
-- tasks テーブルに start_date, end_date を追加
-- ============================================

-- 1. start_date カラムを追加（既存の scheduled_date の値をデフォルトとして使用）
ALTER TABLE tasks 
ADD COLUMN start_date DATE;

-- 2. end_date カラムを追加（既存の scheduled_date の値をデフォルトとして使用）
ALTER TABLE tasks 
ADD COLUMN end_date DATE;

-- 3. 既存データのマイグレーション: scheduled_date の値を start_date, end_date にコピー
UPDATE tasks 
SET 
  start_date = scheduled_date,
  end_date = scheduled_date
WHERE start_date IS NULL OR end_date IS NULL;

-- 4. インデックスを追加（パフォーマンス最適化）
CREATE INDEX idx_tasks_start_date ON tasks(start_date);
CREATE INDEX idx_tasks_end_date ON tasks(end_date);

-- 5. (オプション) 新規タスクでは start_date, end_date を必須にする場合
-- 注意: 既存データがある場合は NOT NULL 制約を追加する前に
--       全てのレコードに値が入っていることを確認してください
-- ALTER TABLE tasks ALTER COLUMN start_date SET NOT NULL;
-- ALTER TABLE tasks ALTER COLUMN end_date SET NOT NULL;
```

### 確認用クエリ

```sql
-- マイグレーション後の確認
SELECT 
  id, 
  title, 
  scheduled_date, 
  start_date, 
  end_date,
  status
FROM tasks 
ORDER BY created_at DESC 
LIMIT 10;
```

### ロールバック用SQL（必要な場合）

```sql
-- v1.1 のカラムを削除して元に戻す
DROP INDEX IF EXISTS idx_tasks_start_date;
DROP INDEX IF EXISTS idx_tasks_end_date;
ALTER TABLE tasks DROP COLUMN IF EXISTS start_date;
ALTER TABLE tasks DROP COLUMN IF EXISTS end_date;
```

---

## 📄 ライセンス

MIT License
