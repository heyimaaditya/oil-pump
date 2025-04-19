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
COPY package*.json ./
# Install only production dependencies
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
# Environment variables for Kafka (can be overridden in docker-compose)
ENV KAFKA_BROKERS=kafka:9092
ENV KAFKA_TOPIC=oil_equipment_data
ENV MESSAGE_INTERVAL_MS=1000

CMD ["node", "dist/main.js"]