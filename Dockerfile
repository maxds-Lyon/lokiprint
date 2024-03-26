FROM docker.io/node:21-alpine3.18

LABEL tags=0.3.0

COPY . /app/
WORKDIR /app
RUN apk add npm pandoc
RUN apk add typst --repository=https://dl-cdn.alpinelinux.org/alpine/edge/testing
RUN npm ci
ENV EXECUTOR=local

ENTRYPOINT ["node", "/app/index.mjs"]
