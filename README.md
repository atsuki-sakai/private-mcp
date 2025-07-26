# Convex + Hono + MCP Server Template

このプロジェクトは、ConvexをデータベースとしてHono/Node.jsでAPIサーバーを構築し、MCPサーバーを通して自然言語でデータベース操作を行うためのテンプレートです。

## 技術スタック

### Backend API Server
- **Hono**: 高速な Web フレームワーク
- **@hono/node-server**: Node.js用のHonoアダプター
- **Convex**: リアルタイムデータベース
- **bcrypt**: パスワードハッシュ化
- **TypeScript**: 型安全性

### MCP Server
- **@modelcontextprotocol/sdk**: MCP（Model Context Protocol）SDK
- **hono-mcp-server-sse-transport**: Server-Sent Events を使用したMCPトランスポート
- **Zod**: スキーマバリデーション
- **Hono**: MCPサーバー用のWebフレームワーク

## アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude CLI    │───▶│   MCP Server    │───▶│  Backend API    │
│  (Natural Lang) │    │  (Port: 3001)   │    │  (Port: 3000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │                        │
                                 │                        ▼
                                 │              ┌─────────────────┐
                                 │              │  Convex Database│
                                 │              │   (Cloud/Local) │
                                 │              └─────────────────┘
                                 ▼
                       ┌─────────────────┐
                       │ SSE Connection  │
                       │  (Real-time)    │
                       └─────────────────┘
```

## データベーススキーマ

### Users テーブル
```typescript
{
  name: string,
  email: string,
  passwordHash: string,
  createdAt: number,
  updatedAt: number
}
```

### Rooms テーブル
```typescript
{
  ownerId: Id<"users">,
  userIds: Id<"users">[],
  name: string,
  description: string,
  createdAt: number,
  updatedAt: number
}
```

### Messages テーブル
```typescript
{
  roomId: Id<"rooms">,
  userId: Id<"users">,
  content: string,
  createdAt: number
}
```

## セットアップ手順

### 1. 前提条件
- Node.js (v18以上)
- pnpm
- Convexアカウント（無料プランでも利用可能）

### 2. プロジェクトのクローン
```bash
git clone <repository-url>
cd private-mcp
```

### 3. 依存関係のインストール

#### Backend
```bash
cd backend
pnpm install
```

#### MCP Server
```bash
cd ../mcp-server
pnpm install
```

### 4. Convexの設定

#### Convexプロジェクトの作成
```bash
cd backend
npx convex dev
# 初回はConvexアカウントにログインし、新しいプロジェクトを作成
```

#### 環境変数の設定
`backend/.env.local`を作成:
```bash
CONVEX_URL=https://your-convex-deployment-url.convex.cloud
```

### 5. データベースのセットアップ
```bash
cd backend
npx convex deploy
# スキーマとfunctionsがConvexにデプロイされます
```

## 起動方法

### 1. Convex開発サーバーの起動
```bash
cd backend
npx convex dev
```

### 2. Backend APIサーバーの起動
```bash
cd backend
pnpm dev
# http://localhost:3000 で起動
```

### 3. MCPサーバーの起動
```bash
cd mcp-server
pnpm dev
# http://localhost:3001 で起動
```

## 利用方法

### 1. Claude CLIの設定

MCPサーバーをClaude CLIに登録する必要があります。Claude CLIの設定ファイルに以下を追加：

```json
{
  "mcpServers": {
    "first-mcp-server": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/main.js"],
      "env": {}
    }
  }
}
```

### 2. 自然言語でのデータベース操作

Claude CLIを使用して以下のような自然言語でデータベースを操作できます：

#### ユーザー作成
```
"田中太郎という名前で、email: tanaka@example.com、パスワード: password123 のユーザーを作成してください"
```

#### ユーザー取得
```
"ユーザーID: j57abc123 のユーザー情報を取得してください"
```

#### ユーザー削除
```
"ユーザーID: j57abc123 のユーザーを削除してください"
```

### 3. 利用可能なMCPツール

現在実装されているMCPツール：

- **addUser**: ユーザーを作成
  - 必須パラメータ: name, email, password
- **getUser**: ユーザーを取得
  - 必須パラメータ: id
- **deleteUser**: ユーザーを削除
  - 必須パラメータ: id

### 4. API エンドポイント

#### Users
- `POST /users` - ユーザー作成
- `GET /users/:id` - ユーザー取得
- `DELETE /users/:id` - ユーザー削除

#### Rooms
- `POST /rooms/:ownerId` - ルーム作成
- `GET /rooms/:id` - ルーム取得
- `POST /rooms/:id/owner/:ownerId` - ルームオーナー変更
- `GET /rooms/user/:userId` - ユーザーのルーム一覧
- `POST /rooms/:id/users/:userId` - ルームにユーザー追加
- `DELETE /rooms/:id/owner/:ownerId` - ルーム削除

#### Messages
- `POST /messages/:roomId/:userId` - メッセージ作成
- `GET /messages/:roomId/:userId` - ルームのメッセージ取得

## 拡張方法

### 新しいMCPツールの追加

1. `mcp-server/main.ts`に新しいツールを追加
2. 対応するAPI関数を実装
3. MCPサーバーにツールを登録

例：
```typescript
mcpServer.tool(
    "newTool",
    "新しいツールの説明",
    {
        param1: z.string(),
        param2: z.number()
    },
    async ({ param1, param2 }) => {
        // ツールの実装
    }
);
```

### 新しいAPIエンドポイントの追加

1. `backend/src/index.ts`に新しいルートを追加
2. 必要に応じて`backend/convex/`に新しいクエリ/ミューテーションを作成

## トラブルシューティング

### よくある問題

1. **Convex接続エラー**
   - `CONVEX_URL`が正しく設定されているか確認
   - `npx convex dev`が実行されているか確認

2. **MCPサーバー接続エラー**
   - ポート3001が使用可能か確認
   - Claude CLIの設定が正しいか確認

3. **APIリクエストエラー**
   - Backend APIサーバーが起動しているか確認（port 3000）
   - リクエストボディが正しい形式か確認

## 開発Tips

### デバッグ
- MCPサーバーのログを確認：`console.log`でデバッグ情報を出力
- Convexのダッシュボードでデータベースの状態を確認
- ブラウザの開発者ツールでネットワークリクエストを監視

### テスト
### backendとmcp-serverのサーバを立ち上げる
```bash
# MCPの動作検証のテスト
以下をcursor,claudeなどに追加
{
  mcpServers: {
    "first-mcp-server": {
      "type": "sse",
      "url": "http://localhost:3001/sse"
    }
  }
}
```
### 例: first-mcp-serverを利用して、ユーザーを追加してください。
```bash
# API エンドポイントのテスト
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"テストユーザー","email":"test@example.com","password":"password123"}'
```

## ライセンス

MIT License

## 貢献

プルリクエストやIssueは歓迎します。# private-mcp
