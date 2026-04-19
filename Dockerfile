FROM node:25-alpine AS base

WORKDIR /app

FROM base AS prod-deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile --ignore-scripts

FROM base AS prod
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY . .

ARG APP_VERSION=0.0.0-dev
ENV APP_VERSION=${APP_VERSION}

ENV PORT=3000
ENV NODE_ENV=production
ENV ENVIRONMENT=production
VOLUME /data
ENV DB_PATH=/data/database.db

EXPOSE ${PORT}

CMD [ "node", "--import=tsx", "index.ts" ]