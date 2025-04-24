# Stage 1: Dependencies & Build (Builder)
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build and prisma generate)
RUN npm ci

# Copy prisma schema first
COPY prisma ./prisma/

# Generate Prisma client (uses installed dev dependency)
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Build the application (creates /app/dist)
RUN npm run build

# Stage 2: Production Dependencies Only
FROM node:18-alpine AS prod-deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Stage 3: Runtime Image
FROM node:18-alpine
WORKDIR /app

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy Prisma schema (needed at runtime by Prisma Client)
COPY --from=builder /app/prisma ./prisma/

# Copy package.json (sometimes needed by runtime)
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Run command with shell to execute multiple commands and enable crypto
CMD /bin/sh -c "NODE_OPTIONS=--experimental-global-webcrypto npx prisma generate && NODE_OPTIONS=--experimental-global-webcrypto node dist/src/main.js"