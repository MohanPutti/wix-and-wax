# ============================================================
# Stage 1: Build core module
# ============================================================
FROM node:20-alpine AS core-builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY core/package*.json ./core/
RUN cd core && npm ci

COPY core/ ./core/
RUN cd core && npx tsc || true

# Copy compiled JS back into src/ so server imports (../../core/src/*) resolve at runtime
RUN cp -r /app/core/dist/. /app/core/src/

# ============================================================
# Stage 2: Build server
# ============================================================
FROM core-builder AS server-builder

COPY server/package*.json ./server/
RUN cd server && npm ci

# Copy core schema into server/prisma/ so prisma generates into server/node_modules
RUN mkdir -p /app/server/prisma && cp /app/core/prisma/schema.prisma /app/server/prisma/schema.prisma
RUN cd server && npx prisma generate

COPY server/src ./server/src
COPY server/tsconfig.json ./server/tsconfig.json
RUN cd server && npx tsc || true

# ============================================================
# Stage 3: Production image
# ============================================================
FROM node:20-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

# Core production deps
COPY core/package*.json ./core/
RUN cd core && npm ci --omit=dev

# Server production deps + prisma client
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy core schema into server/prisma/ so prisma generates into server/node_modules
COPY core/prisma/schema.prisma ./server/prisma/schema.prisma
RUN cd server && npx prisma generate

# Compiled server code
COPY --from=server-builder /app/server/dist ./server/dist

# core/src with compiled JS (satisfies ../../core/src/* imports)
COPY --from=server-builder /app/core/src ./core/src

# Uploads directory (bind-mounted at runtime)
RUN mkdir -p /app/uploads

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
