FROM node:25-alpine AS base

WORKDIR /app

FROM base AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY . .

ARG APP_VERSION=0.0.0-dev
ENV APP_VERSION=${APP_VERSION}

RUN pnpm build

FROM base AS prod
COPY --from=build /app/dist /app/dist

ARG APP_VERSION=0.0.0-dev
ENV APP_VERSION=${APP_VERSION}

ENV PORT=3000
ENV NODE_ENV=production
ENV ENVIRONMENT=production
VOLUME /data
ENV DB_PATH=/data/database.db

EXPOSE ${PORT}

CMD [ "node", "--enable-source-maps", "dist/server/index.mjs" ]