# Install dependencies only when needed
FROM node:22-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY patches ./patches
RUN npm install -g corepack
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g corepack
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_AUTH_PROVIDER
ARG NEXT_PUBLIC_AUTH_IDP
ARG NEXT_PUBLIC_EAB_HOST
ARG NEXT_PUBLIC_ACME_HOST
ARG NEXT_PUBLIC_PKI_HOST
ARG NEXT_PUBLIC_DOMAIN_HOST
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_ORGANIZATION_NAME
ARG NEXT_PUBLIC_DOCS_URL
ARG NEXT_PUBLIC_REFETCH_IN_BACKGROUND
ARG NEXT_PUBLIC_DISABLE_DOMAIN
ARG NEXT_PUBLIC_DISABLE_SERVER
ARG NEXT_PUBLIC_DISABLE_USER
ARG NEXT_PUBLIC_DISABLE_ACME
ARG LOGO_SMALL
ARG LOGO_LARGE
ARG FAVICON
ARG NEXT_PUBLIC_DISABLE_CSP

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    --mount=type=secret,id=SENTRY_RELEASE \
    --mount=type=secret,id=SENTRY_ENVIRONMENT \
    --mount=type=secret,id=NEXT_PUBLIC_SENTRY_DSN \
    --mount=type=secret,id=NEXT_PUBLIC_ORGANIZATION_NAME \
    --mount=type=secret,id=NEXT_PUBLIC_EAB_HOST \
    --mount=type=secret,id=NEXT_PUBLIC_ACME_HOST \
    --mount=type=secret,id=NEXT_PUBLIC_PKI_HOST \
    --mount=type=secret,id=NEXT_PUBLIC_DOMAIN_HOST \
    --mount=type=secret,id=NEXT_PUBLIC_DOCS_URL \
    --mount=type=secret,id=NEXT_PUBLIC_AUTH_IDP \
    --mount=type=secret,id=NEXT_PUBLIC_DISABLE_DOMAIN \
    --mount=type=secret,id=NEXT_PUBLIC_DISABLE_SERVER \
    --mount=type=secret,id=NEXT_PUBLIC_DISABLE_USER \
    --mount=type=secret,id=NEXT_PUBLIC_DISABLE_ACME \
    --mount=type=secret,id=NEXT_PUBLIC_AUTH_PROVIDER \
    corepack enable pnpm;\
    if [ -f /run/secrets/SENTRY_RELEASE ]; then \
        echo "Using secrets as environment variables!" && \
        export SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN) && \
        export SENTRY_RELEASE=$(cat /run/secrets/SENTRY_RELEASE) && \
        export SENTRY_ENVIRONMENT=$(cat /run/secrets/SENTRY_ENVIRONMENT) && \
        export NEXT_PUBLIC_SENTRY_DSN=$(cat /run/secrets/NEXT_PUBLIC_SENTRY_DSN) && \
        export NEXT_PUBLIC_ORGANIZATION_NAME=$(cat /run/secrets/NEXT_PUBLIC_ORGANIZATION_NAME) && \
        export NEXT_PUBLIC_EAB_HOST=$(cat /run/secrets/NEXT_PUBLIC_EAB_HOST) && \
        export NEXT_PUBLIC_ACME_HOST=$(cat /run/secrets/NEXT_PUBLIC_ACME_HOST) && \
        export NEXT_PUBLIC_PKI_HOST=$(cat /run/secrets/NEXT_PUBLIC_PKI_HOST) && \
        export NEXT_PUBLIC_DOMAIN_HOST=$(cat /run/secrets/NEXT_PUBLIC_DOMAIN_HOST) && \
        export NEXT_PUBLIC_DOCS_URL=$(cat /run/secrets/NEXT_PUBLIC_DOCS_URL) && \
        export NEXT_PUBLIC_AUTH_IDP=$(cat /run/secrets/NEXT_PUBLIC_AUTH_IDP) && \
        export NEXT_PUBLIC_DISABLE_DOMAIN=$(cat /run/secrets/NEXT_PUBLIC_DISABLE_DOMAIN) && \
        export NEXT_PUBLIC_DISABLE_SERVER=$(cat /run/secrets/NEXT_PUBLIC_DISABLE_SERVER) && \
        export NEXT_PUBLIC_DISABLE_USER=$(cat /run/secrets/NEXT_PUBLIC_DISABLE_USER) && \
        export NEXT_PUBLIC_DISABLE_ACME=$(cat /run/secrets/NEXT_PUBLIC_DISABLE_ACME) && \
        export NEXT_PUBLIC_DISABLE_ACME=$(cat /run/secrets/NEXT_PUBLIC_AUTH_PROVIDER) && \
        pnpm build; \
    else \
        echo "No secrets found, using environment variables!" && \
        pnpm build; \
    fi

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# You only need to copy next.config.js if you are NOT using the default configuration
# COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "server.js"]
