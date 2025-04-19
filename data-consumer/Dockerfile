# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
# Kafka env vars (can be overridden)
ENV KAFKA_BROKERS=kafka:9092
ENV KAFKA_TOPIC=oil_equipment_data
ENV KAFKA_GROUP_ID=oil-data-consumer-group
# Postgres env vars (can be overridden)
ENV POSTGRES_HOST=postgres
ENV POSTGRES_PORT=5432
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=example # Use secrets in production
ENV POSTGRES_DB=oil

EXPOSE 8080
CMD ["node", "dist/server.js"]