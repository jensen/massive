FROM node:16-alpine as base

ENV NODE_ENV production

RUN apk add openssl sqlite

FROM base as deps

RUN mkdir /app
WORKDIR /app

ADD package.json package-lock.json ./
RUN npm install --production=false

FROM base as production-deps

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
ADD package.json package-lock.json ./
RUN npm prune --production

FROM base as build

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD prisma .
RUN npx prisma generate

ADD . .
RUN npm run build

FROM base

ENV DATABASE_URL=file:/data/production.db
ENV PORT=8080
ENV NODE_ENV=production

RUN echo "#!/bin/sh\nset -x\nsqlite3 \$DATABASE_URL" > /usr/local/bin/database-cli && chmod +x /usr/local/bin/database-cli

RUN mkdir /app
WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma

COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/prisma /app/prisma
COPY --from=build /app/entrypoint.sh /app/entrypoint.sh
ADD . .

RUN chmod +x entrypoint.sh

ENTRYPOINT [ "./entrypoint.sh" ]