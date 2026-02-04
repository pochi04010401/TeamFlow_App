# TeamFlow - チーム管理一元化Webアプリ

チーム8名のタスク・売上・スケジュールをスマホで一元管理できるWebアプリケーション。

## ✨ 主な機能

- 📊 **ダッシュボード**: 売上・ポイントメーターで目標達成度を可視化
- 📅 **チームカレンダー**: メンバー別の色分けでスケジュールを一覧表示
- ✏️ **タスク登録**: スマホ最適化された入力フォーム
- 🎉 **完了エフェクト**: タスク完了時の紙吹雪演出
- 🔐 **招待制ログイン**: ホワイトリストによるアクセス制限
- 📱 **PWA対応**: ホーム画面に追加してネイティブアプリのように使用可能

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
│   ├── schedule/page.tsx    # チームカレンダー
│   ├── input/page.tsx       # タスク登録
│   └── globals.css          # グローバルスタイル
├── components/
│   ├── ui/                  # UIコンポーネント
│   ├── Dashboard.tsx        # ダッシュボードコンポーネント
│   ├── TeamCalendar.tsx     # カレンダーコンポーネント
│   ├── TaskForm.tsx         # タスク登録フォーム
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

## 📄 ライセンス

MIT License
