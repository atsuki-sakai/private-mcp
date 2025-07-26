FROM node:20-alpine

WORKDIR /app

# pnpmのインストール
RUN corepack enable

# 依存関係のコピーとインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# ソースコードのコピー
COPY . .

# Next.jsのビルド（本番環境用）
# RUN pnpm build

EXPOSE 3002

# 開発モード用のコマンド（docker-composeでオーバーライド）
CMD ["pnpm", "dev"]