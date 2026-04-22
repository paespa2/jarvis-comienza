# Dockerfile para Jarvis IA

FROM node:20-alpine

WORKDIR /app

# Build tools needed for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build TypeScript
RUN npx tsc --noEmitOnError false || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run compiled JS
CMD ["node", "dist/server.js"]
