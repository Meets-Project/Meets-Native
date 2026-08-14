# Frontend (Expo)
FROM node:20-alpine

WORKDIR /app

# Copiar package.json
COPY package.json .

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Expor porta (Expo dev server padrão)
EXPOSE 8081

# Comando para iniciar
CMD ["node", "web-server.js"]
