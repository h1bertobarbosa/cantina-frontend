# Etapa 1: compilar Vue
# Build (a partir de cantina-frontend/):
#   docker build -f docker/Dockerfile --build-arg VUE_APP_BACKEND_BASE_URL=<url> -t cantina-frontend .
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vue CLI/webpack só expõe ao bundle variáveis com prefixo VUE_APP_
# (lida em src/helper/api.js)
ARG VUE_APP_BACKEND_BASE_URL
ENV VUE_APP_BACKEND_BASE_URL=${VUE_APP_BACKEND_BASE_URL}

RUN npm run build

# Etapa 2: servir os arquivos compilados
FROM nginxinc/nginx-unprivileged:stable-alpine

# O contexto de build é a raiz de cantina-frontend/, os caminhos partem dela
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
