# ── Étape 1 : construction de l'application Angular ──
FROM node:22-alpine AS construction

WORKDIR /app

COPY package.json package-lock.json ./
# PrimeNG 21 déclare Angular 21 en dépendance : --legacy-peer-deps
# accepte Angular 22, comme pour l'installation locale
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx ng build --configuration production

# ── Étape 2 : service des fichiers avec nginx ──
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construction /app/dist/sunugestion/browser /usr/share/nginx/html

EXPOSE 80
