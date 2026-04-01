### 📌 Overview

MockShield AI is a distributed technical assessment system designed to conduct structured mock interviews and resume-based forensic evaluations.

The platform integrates:

 🧠 Multi-tier large language model routing

🧩 Deterministic JSON schema enforcement

🗄 MongoDB storage

🔁 Automated failover handling

🏗 Domain-specific interview simulation logic


The architecture prioritizes reliability, structured AI output handling, and production-level resilience.


---

## 🌐  Live Link

# ⏳ Service Initialization Instructions (Render Cold Start)

# Due to cold start behavior on hosted backend services:

# 1️⃣ Open the backend services first:

# Main Backend: https://mockshield-ai-engine.onrender.com

# Node Backend: https://mockshield-master-node.onrender.com


# 2️⃣ Wait approximately 50 seconds until both services indicate active or running status.

# 3️⃣ Then open the frontend:

# Frontend: https://mockshield-20.vercel.app

---

## 🛠 Tech Stack

Architected adhering to strict **Domain-Driven Design (DDD)** principles within a distributed microservices topology:

### Frontend (Client UI & Edge Processing)

* React.js (Vite)
* Tailwind CSS
* Context API / Hooks (State Management)
* WebRTC / MediaDevices API (Telemetry Capture)
* jsPDF (Binary Blob / Report Generation)

### Core API Gateway

* Node.js
* Express.js
* Middleware Orchestration
* Secure CORS / JWT Authentication
* Async I/O Handling

### AI Microservice (Inference Engine)

* Python 3.10+
* FastAPI (ASGI)
* Uvicorn
* AST (Abstract Syntax Tree) Parsing
* Google Gemini API SDK

### Persistence Layer

* MongoDB
* Connection Pooling for High Throughput

---

## 🧠 System Architecture


![architecture](https://github.com/user-attachments/assets/d7ef68fa-bc27-449c-9dbe-8fb36494a5c6)

### Data Flow Pipeline

#### 1. Telemetry & Stream Capture (Edge)

* React client initializes:

  * Web Speech API → real-time speech-to-text
  * DOM APIs:

    * Visibility API
    * Fullscreen API
  * Canvas-based pixel luminosity analysis → occlusion detection

#### 2. API Gateway Routing

* Telemetry payloads serialized as JSON
* Sent via REST endpoints to Node.js backend
* Backend responsibilities:

  * Request validation
  * Stateless session handling
  * Initial audit logging → MongoDB

#### 3. LLM Orchestration (The Gauntlet)

* Node.js → HTTP RPC → Python FastAPI microservice
* Engine responsibilities:

  * JSON-schema-bound prompt construction
  * Gemini API invocation
  * 55-tier fallback heuristic handling:

    * Rate limits
    * 503 errors
    * Malformed JSON
* Custom AST parser:

  * Sanitizes response
  * Extracts valid structured data

#### 4. State Reconciliation & Reporting

* AI evaluation returned → Node.js
* Combined with:

  * Proctoring integrity score
* Stored in MongoDB
* Frontend:

  * Fetches synthesized JSON
  * Generates timestamped PDF report

---

## 🧩 Key Engineering Decisions

### Microservices Topology

* Node.js → optimized for async I/O
* Python → optimized for CPU-bound processing
* Benefits:

  * Independent scaling
  * Fault isolation

### MongoDB (NoSQL Architecture)
# Enforces:

* High Velocity Data Throughput (Optimized for rapid AI-generated writes)

* Document-Level Atomicity (Ensures ACID compliance per interview record)

# Maintains unified, high-speed documents for:

* Candidate Profiles (Stored as flexible, root documents)

* Audit Logs (Embedded directly for real-time integrity tracking)

* Assessment Metrics (Nested BSON for instant report retrieval)
### Edge-Computing Proctoring

* Processing shifted to browser:

  * Reduces server load
  * Minimizes bandwidth usage
  * Enables sub-millisecond violation detection

---

## 📋 Prerequisites

Ensure environment setup:

* Node.js (v18+)
* Python (3.10+)
* MongoDB (Local / Cloud)
* Git

---

## 🔑 Environment Variables

### 1. Node.js Backend (`backend/.env`)

```
DATABASE_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mockshield?retryWrites=true&w=majority
PORT=8000
```

### 2. Python AI Engine (`ai-engine/.env`)

```
GEMINI_API_KEY=your_production_gemini_api_key_here
PORT=8000
```

---

## 🚀 Local Deployment & Execution

Run **3 parallel terminals**:

---

### Terminal 1: Core Gateway (Node.js)

```
cd backend
npm install
npm start
```

✅ Expected Log: MongoDB Connected Successfully

---

### Terminal 2: AI Microservice (Python)

```
cd ai-engine

python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate

pip install -r requirements.txt

python -m app.main
```

✅ Expected Log: Uvicorn running on http://0.0.0.0:8000

---

### Terminal 3: Frontend (React)

```
cd frontend
npm install
npm run dev
```

✅ Open: http://localhost:5173

---

## 🌍 Production Deployment Strategy

### Database Tier

* MongoDB Atlas

### Core API Gateway

* Docker / Render / Railway / AWS ECS

### AI Microservice

* Python container (Fly.io / Render)
* Internal API only (VPC restricted)

### Client Application

* Build: `npm run build`
* Deploy: Vercel / Netlify (CDN edge delivery)

---

## 🧪 Automated Testing

### Node.js Gateway

```
cd backend
npm run test
```

### Python AI Engine

```
cd ai-engine
pytest tests/
```

---

## 🚧 Technical Bottlenecks & Future Roadmap

### Web Speech API Determinism

* Issue: Browser-dependent inconsistency
* Solution:

  * Shift to Whisper-based async transcription
  * Use WebSocket streaming

---

### Proctoring Evasion Risks

* Issue: Virtual camera spoofing (OBS, etc.)
* Solution:

  * WebRTC streaming
  * Server-side ML:

    * Gaze tracking
    * Multi-face detection

---

### Database Lock Contention

* Issue: Simultaneous AI writes → Operation queuing/  latency

* Solution:

  * Distributed Redis caching
  * Event-driven buffer system
  * Asynchronous non-blocking writes

---

# 📡 AI Engine API Reference

Method	Endpoint	Description

# POST	/generate	Generate mock interview questions
# POST	/evaluate_session	Evaluate technical transcript
# POST	/generate_resume_questions	Initialize resume audit
# POST	/evaluate_resume_session	Resume-linked transcript evaluation
# POST	/chat	Context-aware follow-up interaction
# GET	/interviews	Retrieve saved sessions
# POST	/interviews	Persist completed session
# DELETE	/interviews/{id}	Delete specific session
# DELETE	/api/sessions/clear	Clear all user sessions


All endpoints enforce structured JSON schema validation.


---

### 📐 Engineering Principles

Deterministic AI output handling

Production-grade failover design

Microservice isolation

Structured persistence strategy

Defensive JSON validation
