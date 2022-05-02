FROM node as build-stage

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm install 

COPY . /app

RUN npm run build
FROM nginx:1.21.6-alpine
COPY --from=build-stage /app/build/ /usr/share/nginx/html