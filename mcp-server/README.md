# MCP Server (Model Context Protocol)

このディレクトリには、HonoとSSE（Server-Sent Events）を使用したMCPサーバーが含まれています。Claude CLIから自然言語でBackend APIを操作するためのMCPツールを提供します。

## 技術スタック

- **@modelcontextprotocol/sdk**: MCP（Model Context Protocol）の公式SDK
- **hono-mcp-server-sse-transport**: SSEを使用したMCP通信ライブラリ
- **Hono**: 高速・軽量なWebフレームワーク
- **@hono/node-server**: Node.js用Honoアダプター
- **Zod**: スキーマバリデーション & 型安全性
- **TypeScript**: 型安全性の確保

## MCP（Model Context Protocol）とは

MCPは、AI言語モデルとアプリケーション間の通信を標準化するプロトコルです。このプロジェクトでは：

1. **Claude CLI** → MCP Server（このアプリケーション） → Backend API
2. 自然言語でのリクエスト → 構造化されたAPI呼び出し
3. リアルタイム通信（SSE）による双方向通信

## プロジェクト構造

```
mcp-server/
├── main.ts                  # MCPサーバーのメインファイル
├── dist/                    # コンパイル後のJavaScriptファイル
├── package.json
├── tsconfig.json
└── README.md
```

## セットアップ

### 1. 依存関係のインストール

```bash
cd mcp-server
pnpm install
```

### 2. TypeScriptのコンパイル & サーバー起動

```bash
pnpm dev
```

サーバーは `http://localhost:3001` で起動します。

### 3. Claude CLIの設定

Claude CLIでMCPサーバーを使用するために設定が必要です。

#### 設定ファイルの場所
- macOS: `~/.claude/config.json`
- Windows: `%APPDATA%\.claude\config.json`
- Linux: `~/.claude/config.json`

#### 設定例
```json
{
  "mcpServers": {
    "first-mcp-server": {
      "command": "node",
      "args": ["/Users/username/path/to/mcp-server/dist/main.js"],
      "env": {}
    }
  }
}
```

**または**、開発中は直接TypeScriptファイルを実行：
```json
{
  "mcpServers": {
    "first-mcp-server": {
      "command": "npx",
      "args": ["tsx", "/Users/username/path/to/mcp-server/main.ts"],
      "env": {}
    }
  }
}
```

## 利用可能なMCPツール

現在実装されているMCPツール：

### 1. addUser
**説明**: 新しいユーザーをデータベースに追加

**パラメータ**:
- `name` (string, 必須): ユーザー名（1-255文字）
- `email` (string, 必須): メールアドレス（有効な形式）
- `password` (string, 必須): パスワード（6-255文字）

**使用例**:
```
"田中太郎という名前で、email: tanaka@example.com、パスワード: password123 のユーザーを作成してください"
```

### 2. getUser
**説明**: 指定されたIDのユーザー情報を取得

**パラメータ**:
- `id` (string, 必須): ユーザーID（1-255文字）

**使用例**:
```
"ユーザーID: j57abc123def456 のユーザー情報を取得してください"
```

### 3. deleteUser
**説明**: 指定されたIDのユーザーを削除

**パラメータ**:
- `id` (string, 必須): ユーザーID（1-255文字）

**使用例**:
```
"ユーザーID: j57abc123def456 のユーザーを削除してください"
```

## アーキテクチャ詳細

### SSE（Server-Sent Events）通信

```
┌─────────────────┐    HTTP/SSE    ┌─────────────────┐    HTTP/REST   ┌─────────────────┐
│   Claude CLI    │ ──────────────▶│   MCP Server    │ ──────────────▶│  Backend API    │
│                 │                │  (Port: 3001)   │                │  (Port: 3000)   │
│                 │◀────────────── │                 │◀────────────── │                 │
└─────────────────┘    JSON/SSE    └─────────────────┘    JSON/REST   └─────────────────┘
```

### 通信フロー

1. **Claude CLI** がSSE接続を開始 (`GET /sse`)
2. **MCP Transport** が作成され、セッション管理
3. **Claude CLI** がMCPメッセージを送信 (`POST /messages`)
4. **MCP Server** がツール実行、Backend APIを呼び出し
5. **結果** がSSE経由でClaude CLIに返送

### エンドポイント

#### `GET /sse`
- SSE接続を確立
- MCPトランスポートを初期化
- セッション管理開始

#### `POST /messages`
- MCPメッセージを受信・処理
- パラメータ: `sessionId` (query parameter)
- MCP SDK経由でツールを実行

## 開発

### サーバーの起動
```bash
pnpm dev
```

### TypeScriptのコンパイルのみ
```bash
npx tsc --project tsconfig.json
```

### コンパイル後のJavaScript実行
```bash
node dist/main.js
```

## 新しいMCPツールの追加

### 1. API関数の実装

```typescript
async function newApiFunction(param1: string, param2: number) {
    try {
        const response = await fetch(`${apiUrl}/new-endpoint`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ param1, param2 }),
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return {
            success: true,
            data: data,
            message: "Operation successful"
        };
    } catch (error) {
        throw new Error(`Failed to execute: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
```

### 2. MCPツールの登録

```typescript
mcpServer.tool(
    "newTool",
    "新しいツールの説明",
    {
        param1: z.string().min(1).max(255),
        param2: z.number().min(0).max(999),
    },
    async ({ param1, param2 }) => {
        try {
            const result = await newApiFunction(param1, param2);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
                isError: true
            };
        }
    }
);
```

## 設定変数

### サーバー設定（main.ts上部）
```typescript
const isHttps = false;           // HTTPS使用の有無
const host = "localhost";        // ホスト名
const port = 3001;              // MCPサーバーのポート
const apiUrl = "http://localhost:3000/users";  // Backend APIのURL
```

### MCP Server設定
```typescript
const mcpServer = new McpServer({
    name: "first-mcp-server",    // MCP サーバー名
    version: "1.0.0",           // バージョン
    description: "A simple MCP server",  // 説明
});
```

## エラーハンドリング

### API呼び出しエラー
```typescript
// 404エラーの処理
if (response.status === 404) {
    throw new Error(`User with id '${id}' not found`);
}

// その他のHTTPエラー
if (!response.ok) {
    throw new Error(`Failed to get user: ${response.status} ${response.statusText}`);
}
```

### MCP応答エラー
```typescript
// エラー応答の形式
return {
    content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }],
    isError: true  // エラーフラグ
};
```

## トラブルシューティング

### よくある問題

1. **SSE接続エラー**
   ```
   Error: SSE connection failed
   ```
   - ポート3001が使用可能か確認
   - ファイアウォールの確認
   - `lsof -ti:3001 | xargs kill -9` でプロセス終了

2. **MCPツール認識エラー**
   ```
   Error: Tool not found
   ```
   - Claude CLIの設定ファイルを確認
   - MCPサーバーのパスが正しいか確認
   - Claude CLIを再起動

3. **Backend API接続エラー**
   ```
   Error: Failed to connect to backend
   ```
   - Backend APIサーバーが起動しているか確認（port 3000）
   - `apiUrl`の設定を確認

4. **TypeScript コンパイルエラー**
   ```
   Error: Cannot find module
   ```
   - `pnpm install` で依存関係を再インストール
   - `tsconfig.json` の設定を確認

### デバッグ

#### サーバーログの確認
```typescript
console.log("SSE Connected.");  // SSE接続時
console.log("SSE Transport created." + transport.sessionId);  // トランスポート作成時
console.log("SSE Transport aborted." + transport.sessionId);  // 接続終了時
```

#### APIリクエストのデバッグ
```typescript
// リクエスト内容をログ出力
console.log("API Request:", { method, url, body });

// レスポンスをログ出力  
console.log("API Response:", { status: response.status, data });
```

#### MCPメッセージのデバッグ
```typescript
// 受信したMCPメッセージをログ出力
console.log("MCP Message received:", message);
```

## Claude CLIでの使用方法

### 基本的な使用例

```bash
# Claude CLIを起動
claude

# 自然言語でユーザー作成
> "新しいユーザーを作成してください。名前は山田花子、メールアドレスはhanako@example.com、パスワードはsecure123です"

# ユーザー情報取得
> "ユーザーID j57abc123def456 の情報を表示してください"

# ユーザー削除
> "先ほど作成したユーザーを削除してください"
```

### 複数操作の例

```bash
# 複数のユーザーを一度に作成
> "以下のユーザーを作成してください：
   1. 田中太郎（taro@example.com、password123）
   2. 佐藤花子（hanako@example.com、secure456）
   3. 鈴木次郎（jiro@example.com、mypass789）"
```

## セキュリティ考慮事項

### 認証・認可
- 現在の実装では認証機能なし
- 本番環境では適切な認証の実装が必要

### ネットワークセキュリティ
- ローカル開発環境での使用を想定
- 本番環境では HTTPS/WSS の使用を推奨

### データバリデーション
- Zodスキーマによる入力値検証
- SQLインジェクション対策（Convex側で実装済み）

## 本番環境への展開

### 1. 環境変数の設定
```bash
export NODE_ENV=production
export API_URL=https://your-backend-api.com
export MCP_PORT=3001
```

### 2. Docker化（例）
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### 3. Claude CLI設定（本番環境）
```json
{
  "mcpServers": {
    "production-mcp-server": {
      "command": "node",
      "args": ["/path/to/production/mcp-server/dist/main.js"],
      "env": {
        "NODE_ENV": "production",
        "API_URL": "https://your-backend-api.com"
      }
    }
  }
}
```

## ライセンス

MIT License