FROM node:20-alpine AS dev

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM dev AS builder

COPY frontend ./

ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/frontend
ENV NODE_ENV=production

COPY --from=builder /app/frontend ./

EXPOSE 3000

CMD ["npm", "run", "start"]