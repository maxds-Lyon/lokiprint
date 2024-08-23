FROM docker.io/node:current-alpine

RUN apk add npm pandoc
RUN apk add typst --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community
COPY . /app/
WORKDIR /app
RUN npm ci
ENV EXECUTOR=local

ENTRYPOINT ["node", "/app/index.mjs"]
