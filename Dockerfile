# Dockerfile para Jarvis IA - Simplified with ts-node

FROM node:18-alpine

WORKDIR /app

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run with ts-node directly (no build step needed)
CMD ["npx", "ts-node", "src/server.ts"]
