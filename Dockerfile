# === Backend Build ===
FROM node:20-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# === Frontend Build ===
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# === Production ===
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=backend /app/backend ./backend

# Copy built frontend to serve statically
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Install serve for static files (or let Express serve them)
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "src/index.js"]
