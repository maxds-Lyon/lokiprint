FROM docker.io/node:20-alpine3.18

COPY . /app/
WORKDIR /app
RUN apk add npm pandoc
RUN apk add typst --repository=https://dl-cdn.alpinelinux.org/alpine/edge/testing
RUN npm ci
ENV EXECUTOR=local

ENTRYPOINT ["node", "/app/index.mjs"]
