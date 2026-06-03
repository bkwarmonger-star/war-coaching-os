# Multi-stage build for W.A.R. Coaching OS

# Stage 1: Build
FROM node:22-alpine as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files from builder
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Expose port (default 3000, can be overridden)
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]
