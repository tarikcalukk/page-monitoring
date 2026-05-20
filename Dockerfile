# Multi-stage build for Render deployment
# Builds the React client and the Node API in one container

FROM node:22-bookworm-slim AS client-build
WORKDIR /workspace/client
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM node:22-bookworm-slim AS server-build
WORKDIR /workspace/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
COPY --from=client-build /workspace/client/build ./client_build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=5000 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    curl \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*
COPY --from=server-build /workspace/server /app
RUN mkdir -p /app/data \
  && chown -R node:node /app
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:5000/health || exit 1
CMD ["npm", "start"]
