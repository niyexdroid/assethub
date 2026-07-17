# Stage 1: Build web app
FROM node:20-alpine AS web-builder
ARG VITE_GOOGLE_CLIENT_ID
ARG CACHE_BUST=1
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build

# Stage 2: Build admin panel
FROM node:20-alpine AS admin-builder
WORKDIR /admin
COPY admin/package*.json ./
RUN npm ci
COPY admin/ .
RUN npm run build

# Stage 3: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# Stage 4: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=backend-builder /backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend-builder /backend/dist ./dist
COPY --from=backend-builder /backend/src/database/migrations ./dist/database/migrations
COPY --from=web-builder /web/dist ./public
COPY --from=admin-builder /admin/dist ./public/admin
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
EXPOSE 4000
USER appuser
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/database/seed-admin.js; node dist/app.js"]
