# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Use pnpm (preferred in this repo)
RUN corepack enable

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy sources and build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN pnpm run build

# --- Runtime stage ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built app
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHON_WS_URL=ws://python:8000/ws
EXPOSE 3000

CMD ["node", "dist/main"]