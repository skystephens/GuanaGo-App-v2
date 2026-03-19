# Dockerfile para Backend (Express + Node.js)

FROM node:18-alpine

WORKDIR /app

# Instalar herramientas útiles
RUN apk add --no-cache curl tini

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Crear directorio de uploads
RUN mkdir -p uploads

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Usar tini para manejar correctamente señales
ENTRYPOINT ["/sbin/tini", "--"]

# Comando por defecto
CMD ["npm", "run", "dev"]

# Labels
LABEL maintainer="GuanaGO Team"
LABEL description="GuanaGO Backend - Express + Node.js"
LABEL version="1.0"
