# Install dependencies only when needed
FROM node:16-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY patches ./patches
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM node:16-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN --mount=type=secret,id=SENTRY_DSN \
  --mount=type=secret,id=SENTRY_AUTH_TOKEN \
  --mount=type=secret,id=SENTRY_RELEASE \
  --mount=type=secret,id=NEXT_PUBLIC_EAB_HOST \
  --mount=type=secret,id=NEXT_PUBLIC_PKI_HOST \
  --mount=type=secret,id=NEXT_PUBLIC_DOMAIN_HOST \
  --mount=type=secret,id=NEXT_PUBLIC_AUTH_IDP \
  --mount=type=secret,id=SENTRY_ENVIRONMENT \
  if [ -f /run/secrets/SENTRY_RELEASE ]; then \
    echo "Using secrets as environment variables!" && \
    export SENTRY_RELEASE=$(cat /run/secrets/SENTRY_RELEASE) && \
    export SENTRY_DSN=$(cat /run/secrets/SENTRY_DSN) && \ 
    export SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN) && \
    export NEXT_PUBLIC_EAB_HOST=$(cat /run/secrets/NEXT_PUBLIC_EAB_HOST) && \
    export NEXT_PUBLIC_PKI_HOST=$(cat /run/secrets/NEXT_PUBLIC_PKI_HOST) && \
    export NEXT_PUBLIC_DOMAIN_HOST=$(cat /run/secrets/NEXT_PUBLIC_DOMAIN_HOST) && \
    export NEXT_PUBLIC_AUTH_IDP=$(cat /run/secrets/NEXT_PUBLIC_AUTH_IDP) && \
    export SENTRY_ENVIRONMENT=$(cat /run/secrets/SENTRY_ENVIRONMENT) && yarn build; \
  else \
    echo "No secrets found, using environment variables!" && \
    yarn build; \
  fi

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
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

ENV PORT 3000

CMD ["node", "server.js"]
