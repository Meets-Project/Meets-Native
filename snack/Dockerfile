# ================================
# Build do frontend Expo
# ================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Gera a versão web do Expo
RUN npx expo export --platform web


# ================================
# Servidor do frontend
# ================================
FROM nginx:alpine

# Remove configuração padrão
RUN rm -rf /usr/share/nginx/html/*

# Copia frontend compilado
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]