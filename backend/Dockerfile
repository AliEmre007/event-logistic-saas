FROM node:20-alpine AS base

WORKDIR /app/backend
RUN apk add --no-cache openssl

FROM base AS dev

COPY backend/package*.json ./
COPY prisma ../prisma

RUN npm ci \
    && npx prisma generate

EXPOSE 5000

CMD ["npm", "run", "dev"]

FROM base AS deps

COPY backend/package*.json ./
COPY prisma ../prisma

RUN npm ci \
    && npx prisma generate

FROM deps AS builder

COPY backend/tsconfig.json ./tsconfig.json
COPY backend/src ./src

RUN npm run build \
    && npm prune --omit=dev

FROM node:20-alpine AS runner

WORKDIR /app/backend
RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY backend/package.json ./package.json
COPY prisma ../prisma

EXPOSE 5000

CMD ["node", "dist/index.js"]