## Build Enviornment
FROM node:20-alpine3.20 As build

WORKDIR /usr/src/app

COPY package*.json package-lock.json ./

RUN npm ci

COPY ./ ./

ARG BUILD_MODE=production
RUN npx tsc && npx vite build --mode ${BUILD_MODE}

## Production Envo

FROM nginx:stable-alpine as production

COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]