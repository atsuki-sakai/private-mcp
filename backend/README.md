# Backend API Server (Hono + Convex)

このディレクトリには、ConvexをデータベースとしてHonoフレームワークで構築されたAPIサーバーが含まれています。

## 技術スタック

- **Hono**: 高速・軽量なWebフレームワーク
- **@hono/node-server**: Node.js用Honoアダプター
- **Convex**: リアルタイムデータベース & バックエンドサービス
- **bcrypt**: パスワードハッシュ化ライブラリ
- **TypeScript**: 型安全性の確保
- **dotenv**: 環境変数管理

## プロジェクト構造

```
backend/
├── src/
│   └── index.ts              # メインサーバーファイル
├── convex/
│   ├── _generated/           # Convex自動生成ファイル
│   ├── users/
│   │   ├── mutation.ts       # ユーザー関連のミューテーション
│   │   └── query.ts          # ユーザー関連のクエリ
│   ├── rooms/
│   │   ├── mutation.ts       # ルーム関連のミューテーション
│   │   └── query.ts          # ルーム関連のクエリ
│   ├── messages/
│   │   ├── mutation.ts       # メッセージ関連のミューテーション
│   │   └── query.ts          # メッセージ関連のクエリ
│   ├── schema.ts             # データベーススキーマ定義
│   └── tsconfig.json         # Convex用TypeScript設定
├── package.json
├── tsconfig.json
└── README.md
```

## セットアップ

### 1. 依存関係のインストール

```bash
cd backend
pnpm install
```

### 2. Convexプロジェクトの初期化

```bash
# Convexにログイン（初回のみ）
npx convex login

# 新しいConvexプロジェクトを作成、または既存プロジェクトに接続
npx convex dev
```

### 3. 環境変数の設定

`.env.local`ファイルを作成：

```bash
# Convex Deployment URL（npx convex devで表示される）
CONVEX_URL=https://your-deployment-url.convex.cloud
```

### 4. データベーススキーマのデプロイ

```bash
npx convex deploy
```

## 開発

### 開発サーバーの起動

#### Convex開発サーバー（別ターミナル）
```bash
npx convex dev
```

#### API サーバー
```bash
pnpm dev
```

サーバーは `http://localhost:3000` で起動します。

### ビルド
```bash
pnpm build
```

### 本番環境での起動
```bash
pnpm start
```

## API エンドポイント

### Users API

#### POST /users
ユーザーを作成

**Request Body:**
```json
{
  "name": "田中太郎",
  "email": "tanaka@example.com",
  "password": "password123"
}
```

**Response:**
```json
"j57abc123def456"  // ユーザーID
```

#### GET /users/:id
ユーザー情報を取得

**Response:**
```json
{
  "_id": "j57abc123def456",
  "name": "田中太郎",
  "email": "tanaka@example.com",
  "passwordHash": "$2b$10$...",
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000
}
```

#### DELETE /users/:id
ユーザーを削除

**Response:**
```json
{
  "message": "User deleted"
}
```

### Rooms API

#### POST /rooms/:ownerId
ルームを作成

**Response:**
```json
"k68def456ghi789"  // ルームID
```

#### GET /rooms/:id
ルーム情報を取得

**Response:**
```json
{
  "_id": "k68def456ghi789",
  "ownerId": "j57abc123def456",
  "userIds": ["j57abc123def456"],
  "name": "test",
  "description": "test",
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000
}
```

#### GET /rooms/user/:userId
ユーザーが所属するルーム一覧を取得

#### POST /rooms/:id/users/:userId
ルームにユーザーを追加

#### POST /rooms/:id/owner/:ownerId
ルームのオーナーを変更

#### DELETE /rooms/:id/owner/:ownerId
ルームを削除

### Messages API

#### POST /messages/:roomId/:userId
メッセージを作成

**Request Body:**
```json
{
  "content": "こんにちは！"
}
```

#### GET /messages/:roomId/:userId
ルームのメッセージ一覧を取得

## データベーススキーマ

### Users テーブル
```typescript
{
  name: v.string(),           // ユーザー名
  email: v.string(),          // メールアドレス
  passwordHash: v.string(),   // ハッシュ化されたパスワード
  createdAt: v.number(),      // 作成日時（Unix timestamp）
  updatedAt: v.number(),      // 更新日時（Unix timestamp）
}
```

### Rooms テーブル
```typescript
{
  ownerId: v.id("users"),         // ルームオーナーのユーザーID
  userIds: v.array(v.id("users")), // 参加ユーザーのIDリスト
  name: v.string(),               // ルーム名
  description: v.string(),        // ルームの説明
  createdAt: v.number(),          // 作成日時
  updatedAt: v.number(),          // 更新日時
}
```

### Messages テーブル
```typescript
{
  roomId: v.id("rooms"),      // 所属ルームのID
  userId: v.id("users"),      // 送信者のユーザーID
  content: v.string(),        // メッセージ内容
  createdAt: v.number(),      // 送信日時
}
```

## Convex Functions

### Users

#### `users/mutation.ts`
- `createUser`: ユーザーを作成
- `deleteUser`: ユーザーを削除

#### `users/query.ts`
- `getUser`: ユーザー情報を取得

### Rooms

#### `rooms/mutation.ts`
- `createRoom`: ルームを作成
- `updateRoomOwner`: ルームオーナーを変更
- `addUserToRoom`: ルームにユーザーを追加
- `deleteRoom`: ルームを削除

#### `rooms/query.ts`
- `getRoom`: ルーム情報を取得
- `getRoomsByUserId`: ユーザーが所属するルーム一覧を取得

### Messages

#### `messages/mutation.ts`
- `createMessage`: メッセージを作成

#### `messages/query.ts`
- `getMessagesByRoomId`: ルームのメッセージ一覧を取得

## 開発Tips

### Convexダッシュボード
Convexの管理画面（Dashboard）でデータの確認・編集が可能：
```bash
npx convex dashboard
```

### データベースのリセット
```bash
npx convex run --prod clearAllTables  # 全テーブルをクリア（注意）
```

### ログの確認
```bash
npx convex logs  # Convex関数のログを表示
```

### スキーマの更新
`convex/schema.ts`を変更後：
```bash
npx convex deploy  # 変更をデプロイ
```

## エラーハンドリング

### 一般的なエラーレスポンス
```json
{
  "error": "エラーメッセージ"
}
```

### HTTPステータスコード
- `200`: 成功
- `400`: リクエストエラー（必須パラメータ不足など）
- `404`: リソースが見つからない
- `500`: サーバーエラー

## セキュリティ

### パスワードハッシュ化
- bcryptを使用してパスワードをハッシュ化
- ソルトラウンド：10

### 環境変数
- 機密情報は `.env.local` で管理
- `.env.local` は `.gitignore` に含める

## トラブルシューティング

### よくある問題

1. **Convex接続エラー**
   ```
   Error: Failed to connect to Convex
   ```
   - `CONVEX_URL`の確認
   - `npx convex dev`が実行中か確認

2. **スキーマエラー**
   ```
   Error: Invalid document for table "users"
   ```
   - `convex/schema.ts`の型定義を確認
   - データ挿入時の値が型に合致しているか確認

3. **ポートエラー**
   ```
   Error: listen EADDRINUSE :::3000
   ```
   - ポート3000が使用中でないか確認
   - `lsof -ti:3000 | xargs kill -9` でプロセスを終了

### デバッグ

#### Convex関数のデバッグ
```typescript
// convex関数内でconsole.logを使用
export const debugUser = query({
  handler: async (ctx, args) => {
    console.log("Debug info:", args);  // npx convex logsで確認可能
    // ...
  },
});
```

#### API サーバーのデバッグ
```typescript
// src/index.tsでログ出力
app.post('/users', async (c) => {
  const body = await c.req.json();
  console.log("Request body:", body);  // コンソールに出力
  // ...
});
```

## 本番環境デプロイ

### Convex
```bash
npx convex deploy --prod
```

### API サーバー
お好みのホスティングサービス（Vercel、Railway、etc.）にデプロイ

環境変数の設定を忘れずに：
- `CONVEX_URL`: 本番環境のConvex URL