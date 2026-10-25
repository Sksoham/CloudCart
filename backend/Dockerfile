FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .

ENV NODE_ENV=production
USER node
EXPOSE 5000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1
CMD ["node", "server.js"]
