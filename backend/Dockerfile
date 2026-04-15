FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

# Copy config files
COPY tsconfig.json ./

# Copy source (overridden by volume mount in dev)
COPY src ./src

EXPOSE 4000

CMD ["sh", "-c", "./node_modules/.bin/ts-node src/database/migrate.ts && npm run dev"]
