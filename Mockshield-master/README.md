# MockShield

**An enterprise-grade, forensic technical assessment and ATS (Applicant Tracking System) integration platform.**
Engineered with deterministic browser-based proctoring telemetry and a highly fault-tolerant, multi-model Large Language Model (LLM) orchestration engine for automated candidate evaluation.

---

## 🔗 Live Link

**Status:** In Development
*(Replace with deployed URL when available)*

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

* PostgreSQL (ACID-compliant RDBMS)
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
  * Initial audit logging → PostgreSQL

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
* Stored in PostgreSQL
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

### PostgreSQL over NoSQL

* Enforces:

  * ACID compliance
  * Referential integrity
* Maintains strict relations between:

  * Candidate Profiles
  * Audit Logs
  * Assessment Metrics

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
* PostgreSQL (Local / Cloud)
* Git

---

## 🔑 Environment Variables

### 1. Node.js Backend (`backend/.env`)

```
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/mockshield
PORT=5000
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

✅ Expected Log: PostgreSQL Connected Successfully

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

* Supabase / AWS RDS (Managed PostgreSQL)

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

* Issue: High concurrency → connection pool exhaustion
* Solution:

  * Redis caching layer
  * RabbitMQ queue system
  * Async DB writes

---
