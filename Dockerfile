FROM golang:1.18.2 as wasm-builder

COPY wasm /app
WORKDIR /app
RUN make

FROM node:18 as build-stage

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
WORKDIR /app
RUN npm ci 

COPY . /app

RUN GENERATE_SOURCEMAP=false npm run build
FROM nginx:1.21.6-alpine

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=wasm-builder /app/csr.wasm /usr/share/nginx/html/csr.wasm
COPY --from=wasm-builder /app/wasm_exec.js /usr/share/nginx/html/wasm_exec.js
COPY --from=build-stage /app/build/ /usr/share/nginx/html