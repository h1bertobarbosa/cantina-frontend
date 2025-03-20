# Etapa 1: Construção da aplicação Vue.js
FROM node:20 AS builder

WORKDIR /app
COPY ../package.json ../package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2: Servindo os arquivos estáticos com Nginx
FROM nginx:alpine

# Copia os arquivos da build para o diretório padrão do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia um arquivo de configuração customizado do Nginx (opcional)
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
