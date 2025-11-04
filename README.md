# Node ↔ Python Real-time Bridge

A minimal architecture that bridges a NestJS server and a FastAPI server over WebSockets, with a simple Python CLI client. The Node server relays real-time progress and final results from Python back to the client.

## Architecture Diagram

```mermaid
flowchart LR
  C[Client CLI / Browser] <-- ws://localhost:3000/ws --> N[NestJS Gateway (/ws)]
  N -- ws://python:8000/ws --> P[FastAPI WebSocket (/ws)]
  P -->|progress/final| N -->|progress/final| C
```

## Technical Design

- Protocol: WebSocket end-to-end for true streaming (no polling, no task IDs).
- Node (NestJS):
  - Hosts a WebSocket gateway at `ws://<host>:3000/ws`.
  - On client message `{ "text": "..." }`, opens a WebSocket to Python (`PYTHON_WS_URL`), forwards the text, and relays messages back.
  - Cleans up Python socket when the client disconnects.
- Python (FastAPI):
  - Hosts a WebSocket endpoint at `/ws`.
  - On receiving text, sends progress updates every second and then a final result (mock AI logic: uppercase transformation).
- Why WebSockets:
  - Simple, low-latency, bi-directional streaming.
  - Minimal dependencies and friction for dev testing.

## Folder Structure

- `node/` NestJS server (WebSocket Gateway)
- `python/` FastAPI server (WebSocket)
- `client/` Python CLI client (websocket-client)
- `docker-compose.yml` Orchestrates Node and Python services
- `README.md` Project documentation

### How to Run

#### Run with Docker (recommended)
- Build and start both services:
  - `docker compose up --build`
- Services:
  - Node: `ws://localhost:3000/ws`
  - Python: `ws://localhost:8000/ws`
- Stop:
  - `docker compose down`

#### Run locally (pnpm)
- Start Python (in `python/`):
  - `pip install -r requirements.txt`
  - `uvicorn app:app --host 0.0.0.0 --port 8000`
- Start Node (in `node/`):
  - `pnpm install`
  - `pnpm run start` (or `pnpm run start:dev`)
- Run client (in `client/`):
  - `pip install -r requirements.txt`
  - `python client.py`

### Quick Manual Test (without client.py)

- With `wscat` (Node websocket client):
  - `pnpm dlx wscat -c ws://localhost:3000/ws`
  - Send: `{"text": "hello world"}`

You should see incremental `progress` messages followed by a `final` result.

## Configuration

- `node/.env.example`
  - `PORT=3000`
  - `PYTHON_WS_URL=ws://python:8000/ws` (use service name inside Docker Compose)
- `python/.env.example`
  - `PYTHON_PORT=8000`
- `client/.env.example`
  - `NODE_WS_URL=ws://localhost:3000/ws`
  - `TEXT=This is a test message from client.py`

Compose uses sensible defaults (`NODE_PORT`, `PYTHON_PORT`, `PYTHON_WS_URL`). You can override at runtime using environment variables, or create a `.env` in the repo root.

## Implementation Notes

- Node WebSocket gateway path: `/ws` (uses `@nestjs/platform-ws`).
- Python FastAPI WebSocket path: `/ws` (served by `uvicorn`).
- Node connects to Python using `PYTHON_WS_URL` (default `ws://localhost:8000/ws`, or `ws://python:8000/ws` in Compose).
- Client expects to connect to Node at `ws://localhost:3000/ws`.

## Improvement Ideas

- Robustness:
  - Health checks and readiness probes
  - Reconnect/backoff strategies for Python bridge
  - Correlation IDs and structured logging
- Security:
  - Authentication for client ↔ Node and Node ↔ Python
  - Rate limiting and input validation at Node boundary
- Observability:
  - Centralized logging and tracing (OpenTelemetry)
  - Metrics on message throughput and latency
- Deployment:
  - CI pipeline running tests and linting
- Scalability:
  - Horizontal scaling of Python with a broker (Redis) and load-balanced workers
  - Backpressure handling and message buffering

## Credits

- NestJS for the server framework and websocket adapter
- FastAPI and Uvicorn for async WebSocket handling
- websocket-client for the CLI testing utility
