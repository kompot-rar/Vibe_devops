# Etap 1: Budowanie aplikacji
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etap 2: Serwowanie aplikacji przez Nginx
FROM nginx:alpine

# Kopiujemy naszą konfigurację Nginx dla SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiujemy zbudowane pliki z poprzedniego etapu
COPY --from=build /app/dist /usr/share/nginx/html

# Expose portu 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
