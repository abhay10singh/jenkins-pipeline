FROM node:26-bookworm-slim

ENV NODE_ENV=production
ENV PORT=3000
ENV TASKS_FILE=/app/data/tasks.json

WORKDIR /app

# Install only runtime dependencies; tests are not needed in production.
COPY package*.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force

# Copy application files.
COPY --chown=node:node server.js ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node public/ ./public/

# Prepare persistent storage and allow the node user to write to it.
RUN mkdir -p /app/data \
    && chown -R node:node /app

USER node

EXPOSE 3000

# Check whether the HTTP API is responding.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
