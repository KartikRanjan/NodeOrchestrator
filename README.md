# 🚀 NodeOrchestrator

A distributed **Node Management System** designed for horizontal scaling. It consists of a **Central Management Server (CMS)** that orchestrates multiple **Node Worker** instances.

This project is built with **Node.js, Express, and PostgreSQL**, featuring strict service isolation and two powerful ways to run: **Local Monorepo Scripting** for fast development and **Docker Compose** for production parity.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Redux Toolkit, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express (CMS & Worker)
- **Database:** PostgreSQL (via Supabase / Local)
- **Orchestration:** Docker Compose & `concurrently`
- **Real-time:** Socket.IO (CMS ↔ Dashboard ↔ Nodes)
- **Networking:** Bridge with IPv6 support (for Supabase connectivity)

---

## 🏃 Getting Started

### 1. Prerequisites
- **Node.js 22+** and **npm**
- **Docker & Docker Desktop** (for containerized mode)
- A **PostgreSQL DB_URI** (e.g., from Supabase)

### 2. Initial Setup
Clone the repository and install dependencies in all sub-projects using the root script:
```bash
npm run install:all
```

### 3. Environment Variables
The project uses environment variables for security and configuration.

**Root `.env` (Required):**
Create a `.env` file in the **root directory**. This file is used by the `cms` service (via a symlink or direct reference) and by the `scripts/start-nodes.js` orchestration script.

```env
API_KEY=your_secure_api_key
DB_URI=postgresql://user:pass@host:5432/dbname
```

- **`API_KEY`**: A shared secret used to authenticate Node Workers with the CMS.
- **`DB_URI`**: Connection string for your PostgreSQL database (used by CMS).

> **💡 Tip:** You can generate a secure 32-byte hex key using your terminal:
> ```bash
> # Using openssl
> openssl rand -hex 32
>
> # OR using Node.js
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> **Note:** The `scripts/start-nodes.js` script reads the `API_KEY` directly from the root `.env` to pass it to worker instances. Ensure this file exists before running `npm run nodes`.

**Frontend `.env` (Required):**
The frontend is built with Vite and requires its own `.env` file in the `frontend/` directory. Vite only exposes variables prefixed with `VITE_` to the client-side code.

```env
VITE_CMS_API_URL=http://localhost:3000/api
VITE_CMS_SOCKET_URL=http://localhost:3000
VITE_API_KEY=your_secure_api_key
```

- **`VITE_API_KEY`**: **Must match the `API_KEY` in the root `.env`.** This allows the dashboard to authenticate with the CMS.
- **`VITE_CMS_API_URL`**: The base URL for the CMS REST API.
- **`VITE_CMS_SOCKET_URL`**: The base URL for the CMS Socket.IO server.

---

## 💻 Option A: Local Development (Root Scripts)

The root `package.json` provides scripts to manage the monorepo from a single place.

### Step 1: Start the CMS
The CMS manages the node registry and file distribution.
```bash
npm run cms
```
*Access API at: `http://localhost:3000`*

### Step 2: Start the Frontend (Optional)
Start the React dashboard.
```bash
npm run frontend
```
*Access UI at: `http://localhost:5173`*

### Step 3: Start Node Workers
Spawn multiple workers using the `nodes` script. Each node receives a deterministic 12-char hex ID.
```bash
# Start 1 worker
npm run nodes 1

# Start 5 workers simultaneously
npm run nodes 5
```
*Workers will start on ports `4001, 4002, ...`*

### Step 4: Cleanup
If nodes are left hanging, kill them all with:
```bash
npm run kill:nodes
```

---

## 🐳 Option B: Docker Orchestration

Fully isolated containers with internal networking and automatic horizontal scaling.

### Step 1: Launch the Entire Stack
Build and start the CMS and 3 worker instances:
```bash
docker compose up --build --scale node=3
```

### Step 2: Scale Dynamically
Scale up or down while the stack is running:
```bash
docker compose up --scale node=10 -d
```

**Key Features in Docker:**
- **Service Readiness:** Nodes wait for the CMS healthcheck before registering.
- **Dynamic IDs:** Nodes generate stable identities based on container hostnames.
- **Networking:** Bridge network enables container-to-container communication.

---

## 🏗️ Project Structure

```text
NodeOrchestrator/
├── cms/                 # Central Management Server (Class-based Layered Arch)
├── node-app/            # Lightweight Worker (Functional Arch)
├── frontend/            # React Dashboard (Vite + Redux Toolkit)
├── scripts/             # Local orchestration scripts (start-nodes.js)
├── docker-compose.yml   # Docker orchestration manifest
└── package.json         # Root scripts for monorepo management
```

---

## 📡 API Contract (Cheat Sheet)

### CMS Endpoints (`:3000`)
- `POST /api/nodes/register`: Nodes call this to join the network.
- `GET /api/nodes`: Retrieve all nodes and their statuses.
- `POST /api/files/upload`: Upload a file and propagate it to all active nodes.

### Node Worker Endpoints (`:4001+`)
- `POST /upload`: Secure endpoint for CMS to push files.
- `GET /health`: Basic health check.

---

## 🧪 Sample cURL Commands

> Replace `YOUR_API_KEY` with the value from your root `.env` file.

### Register a Node
```bash
curl -X POST http://localhost:3000/api/nodes/register \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"nodeId": "node-manual-1", "ip": "127.0.0.1", "port": 4001}'
```

### List All Nodes
```bash
curl http://localhost:3000/api/nodes
  -H "x-api-key: YOUR_API_KEY"
```

### Get a Single Node
```bash
curl http://localhost:3000/api/nodes/node-manual-1
  -H "x-api-key: YOUR_API_KEY"
```

### Upload a File (Propagate to All Nodes)
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "x-api-key: YOUR_API_KEY" \
  -F "file=@./README.md"
```

### List All Uploads with Per-Node Status
```bash
curl http://localhost:3000/api/files \
  -H "x-api-key: YOUR_API_KEY"
```

### Disconnect a Node
```bash
curl -X POST http://localhost:3000/api/nodes/disconnect \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"nodeId": "node-manual-1"}'
```

### Node Worker Health Check
```bash
curl http://localhost:4001/health
```

---
