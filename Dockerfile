# Dockerfile para Jarvis IA

FROM node:18-alpine

WORKDIR /app

# Establecer variables de entorno
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Invalidar caché anterior
ARG CACHEBUST=1
RUN echo "Building at $(date)"

# Copiar package files
COPY package.json ./

# Instalar todas las dependencias (necesarias para build)
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Compilar TypeScript - use npx to ensure it runs from node_modules
RUN npx tsc -p tsconfig.server.json

# Verificar que build fue exitoso
RUN test -f /app/dist/server.js || (echo "Build failed: dist/server.js not found" && exit 1)

# Eliminar devDependencies después del build
RUN npm prune --omit=dev

# Clean npm cache
RUN npm cache clean --force

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando para iniciar
CMD ["npm", "start"]
