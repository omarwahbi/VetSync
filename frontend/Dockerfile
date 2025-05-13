# Use Node.js as the base image
FROM node:18-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
# Copy package.json and package-lock.json
COPY package*.json ./
# Install build tools and dependencies needed by canvas on Alpine
RUN apk add --no-cache --virtual .build-deps \
  build-base \
  python3 \
  g++ \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev \
  librsvg-dev && \
  npm_config_build_from_source=true
# Install dependencies
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
# Copy dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application source code
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} 

# Build the application for production
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the frontend port
EXPOSE 3001
# Set port environment variable for Next.js server
ENV PORT=3001

# Run the application in production mode
CMD ["node", "server.js"] 