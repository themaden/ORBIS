# ── ORBIS Backend (Express + Prisma + TypeScript) ──
# Multi-stage: derle → minimal runtime
FROM node:20-alpine AS builder

WORKDIR /app

# Bağımlılıklar (dev dahil — TS derlemesi için lazım)
COPY package.json package-lock.json ./
RUN npm ci

# Prisma client üretimi (schema gerekir)
COPY prisma ./prisma
RUN npx prisma generate

# Kaynak + TypeScript derlemesi
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Çalıştırma katmanı ──
FROM node:20-alpine

WORKDIR /app

# Yalnız production bağımlılıkları
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Builder'dan derlenmiş çıktı + Prisma runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/index.js"]
