# ── Frontend (Vite + React) ──
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build sırasında backend ve AI URL'lerini container hostname olarak ayarla
# (Nginx reverse proxy olduğu için tarayıcıdan /api ve /ai gider)
ENV VITE_API_URL=http://localhost:4000
ENV VITE_AI_URL=http://localhost:8000
RUN npm run build

# ── Nginx ile statik dosya sunumu ──
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
