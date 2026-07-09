FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
# SQL migration files aren't compiled by tsc — copy them separately
COPY --from=builder /app/src/database/migrations ./dist/database/migrations
EXPOSE 4000
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/app.js"]
