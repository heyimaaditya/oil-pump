# Stage 1: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Production image
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./

RUN npm install --only=production --ignore-scripts --prefer-offline
COPY --from=builder /app/dist ./dist


CMD ["node", "dist/main.js"]
