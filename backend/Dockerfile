# Stage 1: Dependencies & Build (Builder)
FROM node:18-slim AS builder
WORKDIR /app

# Install necessary system dependencies for Prisma
RUN apt-get update -y && apt-get install -y --no-install-recommends \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build and prisma generate)
RUN npm ci

# Copy prisma schema first
COPY prisma ./prisma/

# Generate Prisma client with explicit binary target
ENV PRISMA_SCHEMA_ENGINE_BINARY=prisma-schema-engine-debian-openssl-3.0.x \
  PRISMA_QUERY_ENGINE_BINARY=prisma-query-engine-debian-openssl-3.0.x \
  PRISMA_QUERY_ENGINE_LIBRARY=libquery_engine-debian-openssl-3.0.x.so.node \
  PRISMA_FMT_BINARY=prisma-fmt-debian-openssl-3.0.x \
  PRISMA_ENGINES_CHECKSUM=5a69736a55d59e5b7b1d4b7045d5e2b1c40d4d49c8a6c5a739e2ed6f9b3d8b9d
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build the application (creates /app/dist)
RUN npm run build

# Stage 2: Production Dependencies Only
FROM node:18-slim AS prod-deps
WORKDIR /app

# Install necessary system dependencies
RUN apt-get update -y && apt-get install -y --no-install-recommends \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Stage 3: Runtime Image
FROM node:18-slim
WORKDIR /app

# Install necessary system dependencies for runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schema (needed at runtime by Prisma Client)
COPY --from=builder /app/prisma ./prisma/

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy package.json (sometimes needed by runtime)
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Set environment variables for runtime
ENV NODE_ENV=production \
  PRISMA_SCHEMA_ENGINE_BINARY=prisma-schema-engine-debian-openssl-3.0.x \
  PRISMA_QUERY_ENGINE_BINARY=prisma-query-engine-debian-openssl-3.0.x \
  PRISMA_QUERY_ENGINE_LIBRARY=libquery_engine-debian-openssl-3.0.x.so.node \
  PRISMA_FMT_BINARY=prisma-fmt-debian-openssl-3.0.x

# Run command with shell to execute multiple commands and enable crypto
CMD ["node", "dist/src/main.js"]