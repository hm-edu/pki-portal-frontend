FROM node:14 as build-stage

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm ci 

COPY . /app

RUN GENERATE_SOURCEMAP=false npm run build
FROM nginx:1.21.6-alpine

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/build/ /usr/share/nginx/html