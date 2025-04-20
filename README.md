# ⛽ Oil Pump Monitoring System 📊

![Pipeline](https://img.shields.io/badge/Pipeline-Kafka-blue?logo=apachekafka) ![Database](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql) ![Backend](https://img.shields.io/badge/Backend-Node.js%20(TS)-brightgreen?logo=nodedotjs) ![Frontend](https://img.shields.io/badge/Frontend-Angular-red?logo=angular) ![Infrastructure](https://img.shields.io/badge/Infra-Docker-blue?logo=docker)

## Overview

This project simulates an IoT scenario for monitoring oil pump sensor data. It demonstrates a full-stack application using a microservices-oriented approach with modern technologies and production-ready practices.

*   **Data Producer:** Simulates sensor readings (pressure, temperature, vibration, etc.) and publishes them to a Kafka topic.
*   **Kafka Cluster:** Acts as a robust, scalable message broker.
*   **Data Consumer:** Consumes messages from Kafka, performs basic validation, stores data in a PostgreSQL database, sends invalid messages to a Dead-Letter Queue (DLQ), and exposes a RESTful API for data retrieval.
*   **PostgreSQL Database:** Persistently stores the processed sensor data.
*   **Frontend:** An Angular application that visualizes the sensor data retrieved from the Data Consumer API using charts (Chart.js) and supports pagination.

---

### ✨ Core Features

*   **Real-time Data Simulation:** Generates realistic (simulated) sensor data points.
*   **Asynchronous Processing:** Leverages Apache Kafka for decoupling production and consumption.
*   **Persistent Storage:** Uses PostgreSQL for reliable data storage.
*   **API for Data Access:** Express.js backend providing data endpoints.
*   **Data Visualization:** Angular frontend with Chart.js for clear data representation.
*   **Containerized Deployment:** Fully containerized using Docker and Docker Compose for easy setup and consistent environments.
*   **Structured Logging:** Implemented Pino for JSON-based logging in backend services, aiding observability.
*   **API Key Authentication:** Simple API key validation middleware (`X-API-Key` header) secures the data API endpoints.
*   **Dead-Letter Queue (DLQ):** The consumer sends messages that fail processing (after parsing) to a dedicated Kafka topic (`KAFKA_DLQ_TOPIC`) for later inspection or reprocessing.
*   **Docker Secrets:** Manages the PostgreSQL password securely using Docker secrets.
*   **Enhanced Health Checks:** The consumer API includes a `/health` endpoint that verifies database connectivity.
*   **API Pagination:** GET endpoints support `page` and `limit` query parameters for efficient data retrieval, with pagination metadata included in the response.
*   **Basic Testing Setup:** Includes Jest configuration and example test files (`*.test.ts`) for backend services.

---

### 🔧 Technology Stack

*   **Backend:** Node.js, TypeScript, Express.js, KafkaJS, node-postgres (pg), Pino (logging)
*   **Frontend:** Angular, TypeScript, Chart.js (via ng2-charts), Bootstrap
*   **Messaging:** Apache Kafka, Zookeeper
*   **Database:** PostgreSQL
*   **Infrastructure:** Docker, Docker Compose, Nginx (for frontend serving/proxy)
*   **Testing:** Jest (Backend), Angular Testing Utilities (Frontend)

---

### 🏗️ Project Structure


oil-pump-kafka-ts/
├── data-producer/ # Simulates and sends data to Kafka
│ ├── src/
│ ├── Dockerfile
│ ├── jest.config.js
│ ├── package.json
│ └── tsconfig.json
├── data-consumer/ # Consumes from Kafka, stores in DB, serves API
│ ├── src/
│ ├── Dockerfile
│ ├── jest.config.js
│ ├── nodemon.json
│ ├── package.json
│ └── tsconfig.json
├── frontend/ # Angular frontend application
│ ├── src/
│ ├── Dockerfile
│ ├── nginx.conf # Nginx config for serving & proxying
│ ├── angular.json
│ ├── package.json
│ └── tsconfig.json
├── initdb/ # PostgreSQL initialization script
│ └── init.sql
├── docker-compose.yml # Main Docker Compose file to orchestrate all services
├── .env # Local environment variables (GITIGNORED!)
├── .env.example # Example environment variables
├── postgres_password.txt # PostgreSQL password secret (GITIGNORED!)
└── README.md # This file

---

### 🚀 Setup & Running Instructions

Follow these steps precisely to get the entire application running using Docker Compose.

**Prerequisites:**

*   [Docker](https://docs.docker.com/get-docker/) installed and running.
*   [Docker Compose](https://docs.docker.com/compose/install/) installed (usually included with Docker Desktop).
*   [Git](https://git-scm.com/downloads) (for cloning the repository).
*   A text editor (like VS Code).
*   Terminal / Command Prompt / PowerShell.

**Steps:**

1.  **Clone the Repository (If Applicable):**
    ```bash
    git clone <repository-url>
    cd oil-pump-kafka-ts
    ```

2.  **Create PostgreSQL Password Secret:**
    *   In the project root directory (`oil-pump-kafka-ts/`), create a file named `postgres_password.txt`.
    *   Inside this file, put **only** your desired password for the PostgreSQL database (e.g., `mysecretpgpassword`).
    *   **SECURITY:** Ensure `postgres_password.txt` is listed in your `.gitignore` file to prevent committing it.

3.  **Configure Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Open the `.env` file.
    *   **CRITICAL:** Set a unique, strong value for `API_KEY`. This key is needed by the frontend and for any direct API testing.
    *   Adjust `POSTGRES_PORT` (default `5434`) if needed (this is the *host* port mapping).
    *   Review other variables like Kafka topics if necessary.
    *   **SECURITY:** Ensure `.env` is listed in your `.gitignore` file.

4.  **Configure Frontend API Key:**
    *   Open `frontend/src/environments/environment.ts`.
    *   Make sure the value for `apiKey` **exactly matches** the `API_KEY` you set in your `.env` file.
        ```typescript
        // frontend/src/environments/environment.ts
        export const environment = {
          production: true,
          apiUrl: '/api',
          apiKey: 'YOUR_API_KEY_FROM_DOT_ENV' // <<< MATCH .env EXACTLY
        };
        ```

5.  **Clean Docker Environment (Recommended First Time):**
    *   Open your terminal in the project root.
    *   `docker-compose down -v` (Stops containers, removes networks, **deletes database volume**)
    *   `docker builder prune -af` (Clears potentially stale build cache)

6.  **Build Docker Images:**
    *   Build all images using the latest code and configurations, bypassing the cache for certainty:
        ```bash
        docker-compose build --no-cache
        ```

7.  **Start All Services:**
    *   Start the application stack in detached mode:
        ```bash
        docker-compose up -d
        ```
    *   Wait 60-90 seconds for Kafka and Postgres health checks to pass and all services to initialize.

8.  **Verify Services:**
    *   Check running containers:
        ```bash
        docker ps
        ```
        *(Ensure all services defined in `docker-compose.yml` are 'Up' and 'healthy' where applicable)*.
    *   Monitor logs (open separate terminals or follow all):
        ```bash
        docker-compose logs -f data-producer
        docker-compose logs -f data-consumer
        docker-compose logs -f frontend
        # or 'docker-compose logs -f' for all
        ```

9.  **Access the Frontend:**
    *   Open your web browser and navigate to: `http://localhost:4200`
    *   **Important:** If you encounter issues, try an **Incognito/Private** browser window first to rule out browser caching. If it works there, clear the cache in your normal browser for `localhost:4200`.

10. **Stopping the Application:**
    *   To stop all running services:
        ```bash
        docker-compose down
        ```
    *   To stop services AND remove the database volume (deletes all stored data):
        ```bash
        docker-compose down -v
        ```

---

### 🧪 Testing

*   **Backend:** Jest is configured for both `data-producer` and `data-consumer`. Example test files (`*.test.ts`) are included in the `src/__tests__` directories. Run tests within the respective service directory using `npm test`. Current tests are basic examples and should be expanded for comprehensive coverage.
*   **Frontend:** Angular's default testing setup (Karma/Jasmine or Jest depending on CLI version/config) is available. Run tests using `ng test` within the `frontend` directory.

---

### ⚙️ Configuration

*   **Environment Variables:** Most configuration is handled via the `.env` file in the project root, loaded by Docker Compose. See `.env.example` for available options. Key variables include:
    *   `API_KEY`: Secures the data API. **Must be set.**
    *   `KAFKA_BROKERS`: Kafka broker address(es). Defaults correctly for Docker Compose internal (`kafka:9092`) vs. host access (`localhost:29092`).
    *   `KAFKA_TOPIC`, `KAFKA_DLQ_TOPIC`: Names for the main and dead-letter Kafka topics.
    *   `POSTGRES_...`: Database connection details (host port mapping, user, db name).
    *   `MESSAGE_INTERVAL_MS`: Controls data production speed.
*   **Docker Secrets:** The `POSTGRES_PASSWORD` is managed via Docker secrets. The `data-consumer` reads the password from the file path specified by `POSTGRES_PASSWORD_FILE` (mounted by Docker Compose from `postgres_password.txt`).
*   **Nginx:** Frontend proxy settings are in `frontend/nginx.conf`.

---

### 📡 API Usage

*   **Base URL:** `http://localhost:8080/api` (when accessing directly) or `http://localhost:4200/api` (when accessing via the proxied frontend).
*   **Authentication:** All data endpoints require an `X-API-Key` header containing the value set in your `.env` file.
*   **Endpoints:**
    *   `GET /api/health`: Public health check (no API key required). Returns service status.
    *   `GET /api/pressure?page=N&limit=M`: Get paginated pressure data.
    *   `GET /api/material?page=N&limit=M`: Get paginated material/condition data.
    *   `GET /api/fluid?page=N&limit=M`: Get paginated fluid dynamics data.
    *   *(Default `limit` is 50, max is 100)*.

---

### 🧑‍💻 Development Notes

*   **Nginx Proxy:** The frontend service uses Nginx to serve the built Angular application and proxy API requests (`/api/*`) to the `data-consumer` service, handling CORS issues within the Docker network.
*   **Docker Compose Overrides:** Environment variables set directly in the `environment:` section of `docker-compose.yml` (like `KAFKA_BROKERS: kafka:9092` or `POSTGRES_HOST: postgres`) override any values loaded from the `.env` file for that specific service, ensuring correct internal hostnames are used within Docker.

---

### 🔮 Future Enhancements (TODO)

*   Implement more robust input validation (e.g., Zod) for Kafka messages.
*   Add user authentication/authorization (e.g., JWT).
*   Develop a strategy for monitoring and reprocessing messages from the DLQ.
*   Improve UI/UX, add more chart types or data filtering options.
*   Implement comprehensive end-to-end and integration tests.
*   Add monitoring and alerting (e.g., Prometheus, Grafana).
*   Secure API key handling for production frontend builds (avoid hardcoding).
*   Explore Kafka Streams or KSQLdb for stream processing.

---

### 📜 License

Distributed under the MIT License. See `LICENSE` file for more information.


### Author :
Aaditya

![Image](https://github.com/user-attachments/assets/918bf2e3-7d3f-4bd3-95fb-b39bec0160da)
![Image](https://github.com/user-attachments/assets/8caac0a7-2fee-43c9-96e0-50cbfb51236f)

![Image](https://github.com/user-attachments/assets/5c1f70d2-1ea1-489d-b0d8-96d19c5058ad)

![Image](https://github.com/user-attachments/assets/9339a1d5-f321-4d95-8efe-635f8a1b055e)

![Image](https://github.com/user-attachments/assets/872bd1f0-3326-4f44-aca7-c927754c66b9)

![Image](https://github.com/user-attachments/assets/38a40f4e-1c3f-4ec2-9ad5-ac287969d61e)

![Image](https://github.com/user-attachments/assets/b01d3ad7-c9a4-47eb-abc1-2e453ea1a099)

![Image](https://github.com/user-attachments/assets/035298d6-9f74-4bc7-8e83-1f1fbd80e8a7)

![Image](https://github.com/user-attachments/assets/c10ca719-10ce-47f1-ac6d-92bd6a083564)

![Image](https://github.com/user-attachments/assets/1249eff6-560f-49c2-82f2-5bd76b0f9029)

![Image](https://github.com/user-attachments/assets/7df330fb-3b1b-437f-b459-969db08f23f8)
