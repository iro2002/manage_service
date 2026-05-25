# ============================================================
# Stage 1: Build Frontend
# ============================================================
FROM node:22-alpine AS frontend-build

WORKDIR /app

# Copy frontend package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source and build
COPY index.html vite.config.js eslint.config.js ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

# ============================================================
# Stage 2: Production — Backend + Serve Frontend
# ============================================================
FROM node:22-alpine AS production

WORKDIR /app

# Copy backend package files and install production dependencies only
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/dist ./dist/

# Don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/auth/login || exit 1

# Start the server
CMD ["node", "backend/server.js"]
