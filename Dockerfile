FROM node:22-slim

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    gcc \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma/ ./prisma/
COPY src/generated/ ./src/generated/ 2>/dev/null || true

RUN npm install

COPY . .

RUN npx prisma generate && node scripts/build-fix.js

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
