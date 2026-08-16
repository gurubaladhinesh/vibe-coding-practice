# Store Attendance Service

Reactive attendance tracker for supermarket stores. An **owner** can own multiple stores and see both per-store and cumulative dashboards. Managers and employees clock in/out at a single store.

## Local URL

After Compose is up: **http://localhost:3001**

(Port 3000 is commonly used by other Node apps on this machine; the UI container is mapped to 3001.)

API: http://localhost:8080

## Seed logins (password: `password`)

| Role | Store code | Username |
| --- | --- | --- |
| Owner (leave store code empty) | — | `owner` |
| Manager | `MAIN` | `mgr.main` |
| Employee | `MAIN` | `emp1.main` |
| Manager | `EAST` | `mgr.east` |
| Employee | `EAST` | `emp1.east` |

Owner `Asha Patel` owns **Downtown Super Mart (`MAIN`)** and **Eastside Market (`EAST`)**.

## Run with Docker

```bash
cd store-attendance-service
docker compose up --build
```

Postgres (5432) and Redis (6379) start with the API and UI.

## Run API against local containers only

```bash
cd store-attendance-service
docker compose up postgres redis
cd backend && mvn spring-boot:run
cd ../frontend && npm install && npm run dev
```

## Tests

```bash
cd store-attendance-service/backend && mvn test
```
