FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npx prisma generate && npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY docker/backend-entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
