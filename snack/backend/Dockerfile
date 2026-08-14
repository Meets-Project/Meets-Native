# Backend (Express + Bun)
FROM oven/bun:latest

WORKDIR /app

# Copiar package.json e bun.lockb
COPY package.json ./

# Instalar dependências com Bun
RUN bun install

# Copiar código
COPY . .

# Expor porta
EXPOSE 3000

# Comando para iniciar em produção
CMD ["bun", "run", "start"]
