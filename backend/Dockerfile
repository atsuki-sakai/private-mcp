FROM node:20-alpine

WORKDIR /app

# pnpmのインストール
RUN corepack enable

# 依存関係のコピーとインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# 環境変数ファイルのコピー
COPY .env.local ./

# ソースコードのコピー
COPY . .

# TypeScriptのビルド（本番環境用）
# RUN pnpm build

EXPOSE 3000

# 開発モード用のコマンド（docker-composeでオーバーライド）
CMD ["pnpm", "dev"]