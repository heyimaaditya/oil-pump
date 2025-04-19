# Oil & Gas Panel System (Kafka, TypeScript, Node.js, Angular, PostgreSQL)

This project simulates real-time data from an oil pump, processes it through Kafka, stores it in PostgreSQL, and provides a web interface for monitoring using Angular.

**Architecture:**

* **data-producer (Node.js/TypeScript):** Simulates sensor data and publishes it to a Kafka topic (`oil_equipment_data`).
* **Apache Kafka:** Message broker for decoupling the producer and consumer.
* **PostgreSQL:** Database for storing the time-series equipment data.
* **data-consumer (Node.js/TypeScript + Express):** Consumes data from Kafka, persists it to PostgreSQL, and exposes a REST API for the frontend.
* **frontend (Angular):** Web interface built with Angular, Chart.js, and Bootstrap to visualize the data fetched from the `data-consumer` API.
* **Docker Compose:** Orchestrates the deployment of all services.

**Technology Stack:**

* Backend: Node.js, TypeScript, Express.js
* Messaging: Apache Kafka (`kafkajs` client)
* Database: PostgreSQL (`pg` client)
* Frontend: Angular, Chart.js (`ng2-charts`), Bootstrap
* Containerization: Docker, Docker Compose

**Project Structure:**

oil-pump-kafka-ts/
├── data-producer/
├── data-consumer/
├── frontend/
├── initdb/
├── docker-compose.yml
└── README.md


**API Endpoints (Provided by `data-consumer`):**

* `GET /api/pressure`: Retrieve recent pressure-related data (suction, discharge, npsh).
* `GET /api/material`: Retrieve recent material-related data (vibration, bearing temp, impeller speed).
* `GET /api/fluid`: Retrieve recent fluid-related data (flow rate, fluid temp, lubrication level).
* `GET /health`: Basic health check endpoint.

**Run Locally using Docker Compose:**

1.  **Prerequisites:** Ensure you have Docker and Docker Compose installed.
2.  **Clone Repository:** `git clone <your-repo-url>`
3.  **Navigate to Directory:** `cd oil-pump-kafka-ts`
4.  **Build and Start Containers:**
    ```bash
    docker compose up --build -d
    ```
    * `--build`: Forces Docker to rebuild the images if the code has changed.
    * `-d`: Runs containers in detached mode (in the background).

5.  **Access Services:**
    * **Angular Frontend:** `http://localhost:4200`
    * **Data Consumer API:** `http://localhost:8080` (e.g., `http://localhost:8080/api/pressure`)
    * **PostgreSQL (e.g., using pgAdmin/DBeaver):**
        * Host: `localhost`
        * Port: `5434` (as mapped in `docker-compose.yml`)
        * Database: `oil`
        * User: `postgres`
        * Password: `example` (or your value)
    * **Kafka (Optional - using tools like Offset Explorer/AKHQ):** Connect to broker `localhost:29092`

6.  **View Logs:**
    ```bash
    docker compose logs -f             # View logs for all services
    docker compose logs -f data-producer # View logs for a specific service
    ```

7.  **Stop Services:**
    ```bash
    docker compose down
    ```
    * To remove volumes (lose PostgreSQL data): `docker compose down -v`

**Development:**

* Each service (`data-producer`, `data-consumer`, `frontend`) has its own `package.json` and can be developed individually.
* Use `npm run dev` (if configured, like in `data-consumer`) for hot-reloading during development (usually run outside Docker for easier local setup).

**Author:**

* Aaditya
