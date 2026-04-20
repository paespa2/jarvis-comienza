# 🚀 JARVIS IA EN RAILWAY

## Guía Completa para Desplegar en Railway

Railway es una plataforma moderna de deployment que permite desplegar Jarvis IA en segundos.

---

## 📋 REQUISITOS

- Cuenta en [Railway.app](https://railway.app)
- Git instalado
- Node.js 18+
- GitHub conectado a Railway

---

## 🔧 CONFIGURACIÓN PREVIA

### 1. Crear `package.json`

```json
{
  "name": "jarvis-ia",
  "version": "1.0.0",
  "description": "Jarvis IA - Sistema agentico",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "uuid": "^9.0.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.1"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 2. Crear `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build || echo "No build"

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. Crear `.env` (local)

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_PATH=./jarvis.db
GITHUB_TOKEN=optional_github_token
```

### 4. Crear `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5. Crear `.gitignore`

```
node_modules/
dist/
.env.local
*.log
*.db
.DS_Store
```

---

## 🚀 PASOS PARA DESPLEGAR EN RAILWAY

### Opción 1: CLI de Railway (Recomendado)

```bash
# 1. Instalar CLI de Railway
npm install -g @railway/cli

# 2. Login en Railway
railway login

# 3. Crear nuevo proyecto
railway init

# 4. Desplegar
railway up
```

### Opción 2: GitHub + Railway (Más Automático)

#### Paso 1: Push a GitHub
```bash
# Inicializar git si no lo has hecho
git init
git add .
git commit -m "Initial Jarvis IA deployment"
git branch -M main
git remote add origin https://github.com/tu-usuario/jarvis-ia.git
git push -u origin main
```

#### Paso 2: Crear Proyecto en Railway
1. Ve a [Railway Dashboard](https://railway.app/dashboard)
2. Click en **"Create New Project"**
3. Selecciona **"Deploy from GitHub"**
4. Conecta tu repositorio de GitHub
5. Selecciona el branch `main`
6. Click **"Deploy"**

#### Paso 3: Configurar Variables de Entorno
1. En Railway, ve a tu proyecto
2. Click en **"Variables"**
3. Agrega:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `DATABASE_PATH`: `/data/jarvis.db` (Railway proporciona almacenamiento)
   - `GITHUB_TOKEN`: (opcional)

### Opción 3: Railway Web Interface

1. **Dashboard**: https://railway.app/dashboard
2. **New Project** → **Deploy from Repo**
3. Selecciona tu repositorio GitHub
4. Railway detecta automáticamente:
   - Dockerfile ✓
   - package.json ✓
   - Node.js version ✓
5. Configura variables de entorno
6. Click **"Deploy"**

---

## 📊 MONITOREAR DESPLIEGUE

### En Railway Dashboard

```
✅ Build: Compilando...
⏳ Deploy: Desplegando...
🟢 Running: ¡Activo!
```

### URL de tu Jarvis

```
https://tu-proyecto.railway.app
```

### Ver Logs

```bash
# Vía CLI
railway logs

# Vía Dashboard
Project → Logs (tab)
```

---

## 🧪 PRUEBAS DESPUÉS DEL DEPLOYMENT

### Health Check

```bash
curl https://tu-proyecto.railway.app/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "version": "1.0.0",
  "environment": "production"
}
```

### Crear Tarea

```bash
curl -X POST https://tu-proyecto.railway.app/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Analyze security of code",
    "context": {"code": "..."}
  }'
```

### Ver Documentación API

```
https://tu-proyecto.railway.app/api/docs
```

---

## 🔄 ACTUALIZACIONES AUTOMÁTICAS

Railway permite auto-deploy cuando haces push a GitHub:

```bash
# 1. Hacer cambios
echo "// update" >> src/server.ts

# 2. Commit
git add .
git commit -m "Update Jarvis"

# 3. Push
git push origin main

# 4. Railway automáticamente:
#    - Detecta cambios
#    - Construye Docker
#    - Redeploy
```

---

## 📈 ESCALABILIDAD EN RAILWAY

### Aumentar Replicas

1. Dashboard → Tu Proyecto → Settings
2. **"Networking"** → Aumenta replicas
3. Railway distribuye automáticamente

### Almacenamiento Persistente

Railway proporciona `/data` persistent:

```typescript
database: {
  type: 'sqlite',
  database: '/data/jarvis.db'  // Persiste entre deploys
}
```

### Dominio Personalizado

1. Settings → Networking
2. Agrega tu dominio personalizado
3. Configura DNS en tu proveedor

---

## 🔐 VARIABLES DE ENTORNO EN RAILWAY

### Configurar en Dashboard

1. **Project** → **Variables**
2. Agrega cada variable
3. Auto-redeploy si está habilitado

### Variables Recomendadas

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_PATH=/data/jarvis.db
GITHUB_TOKEN=ghp_xxxxx (opcional)
LOG_LEVEL=info
MAX_TASKS_QUEUE=1000
```

---

## 🐛 TROUBLESHOOTING

### Error: "Build failed"

```bash
# Verificar localmente
npm install
npm run build
npm start
```

### Error: "Port already in use"

Railway asigna puerto automáticamente. Asegúrate:
```typescript
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', ...)
```

### Error: "Database connection failed"

Verificar:
- Ruta de base de datos: `/data/jarvis.db`
- Permisos de escritura en `/data`
- Variable `DATABASE_PATH` configurada

### Logs no aparecen

```bash
# Verificar que logs se escriben a stdout
console.log(...) // ✓ Visible
// NO: fs.writeFileSync('./app.log', ...) ✗

# Ver logs en tiempo real
railway logs -f
```

---

## 📊 MONITOREO EN PRODUCCIÓN

### Usar Railway Monitoring

1. **Project** → **Monitoring**
2. Ver:
   - CPU usage
   - Memory usage
   - Network I/O
   - Restarts

### Configurar Alertas

1. **Settings** → **Notifications**
2. Recibe alertas si:
   - App crashes
   - High memory usage
   - Build failures

---

## 💡 TIPS Y BUENAS PRÁCTICAS

### ✅ Hacer

- Usar `process.env.PORT` para puerto
- Escribir logs a `console.log()` (stdout)
- Usar `/data/` para almacenamiento persistente
- Implementar health checks
- Usar variables de entorno para configuración

### ❌ Evitar

- Hardcodear puertos (usa env vars)
- Escribir logs a archivos (usa stdout)
- Almacenar datos en `/tmp` (no persiste)
- Asumir que estás en localhost
- Abrir puertos innecesarios

---

## 🎯 PRÓXIMOS PASOS

### 1. Primeros Usos
```bash
# Health check
curl https://tu-proyecto.railway.app/health

# Crear tarea
curl -X POST https://tu-proyecto.railway.app/api/tasks \
  -d '{"query":"test"}'

# Ver métricas
curl https://tu-proyecto.railway.app/api/metrics
```

### 2. Integración GitHub
1. Configurar webhook en GitHub (Railway lo hace automáticamente)
2. Cada push a `main` → auto-deploy

### 3. Dominio Personalizado
1. Compra dominio (.com, .io, etc)
2. Apunta a Railway via CNAME
3. Railway proporciona SSL automático

### 4. Bases de Datos
Si necesitas PostgreSQL:
1. **Project** → **+ Add Service**
2. Selecciona **PostgreSQL**
3. Railway crea automáticamente y expone variables

---

## 📞 REFERENCIAS

- **Railway Docs**: https://docs.railway.app/
- **Railway CLI**: https://docs.railway.app/deploy/cli
- **Dockerfile Docs**: https://docs.docker.com/engine/reference/builder/
- **Express Server**: https://expressjs.com/

---

## 🎉 ¡JARVIS EN PRODUCCIÓN!

Una vez desplegado:

```
✅ API disponible en: https://tu-proyecto.railway.app
✅ Documentación en: https://tu-proyecto.railway.app/api/docs
✅ Health check en: https://tu-proyecto.railway.app/health
✅ Logs en vivo con: railway logs -f
✅ Monitoreo automático en Railway Dashboard
```

---

## 📸 EJEMPLO DE DEPLOYMENT EXITOSO

```
🚀 Jarvis IA Deployment en Railway

Project: jarvis-ia
URL: https://jarvis-ia-prod.railway.app
Status: ✅ Running

Endpoints:
  GET  /health → ✅ 200 OK
  GET  /api/status → ✅ Healthy
  POST /api/tasks → ✅ Processing
  GET  /api/metrics → ✅ Available
  GET  /api/docs → ✅ Documentation

Performance:
  CPU: 5-15%
  Memory: 120MB
  Uptime: 99.9%

Updates:
  Auto-deploy on git push ✅
  Zero-downtime deployments ✅
  SSL certificate ✅
  CDN included ✅
```

---

**Jarvis IA está listo para servir 24/7 en el cloud** 🌐
