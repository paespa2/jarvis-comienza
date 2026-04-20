# Dockerfile para Jarvis IA

FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Compilar TypeScript (si existe tsconfig)
RUN npm run build 2>/dev/null || echo "No build script"

# Exponer puerto
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
