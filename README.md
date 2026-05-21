# 🔍 XEPA: Anti-Money Laundering (AML) Detection & Monitoring System

XEPA is a state-of-the-art, predictive AML monitoring and investigation platform designed as a high-fidelity MVP. It combines rule-based heuristics with machine learning-inspired scoring, predictive graph forecasting, and cryptographic audit trails to deliver a premium, end-to-end compliance workflow.

---

## 🌟 Key Features

### 1. 🧠 Predictive Analytics & Pattern Memory
- **Behavioral Profiling:** Evaluates transaction frequencies, volume anomalies, and rapid-movement thresholds.
- **Pattern Matching:** Stores and cross-references transaction sequences against recognized money laundering topologies (e.g., structuring, layering, and structuring networks).
- **Ghost-Node Forecasting:** Explores and predicts transaction destinations through hypothetical "ghost nodes" in transaction graphs to flag potential destination wallets or shell bank accounts before funds arrive.

### 2. 🛡️ Cryptographic Audit Ledger
- **Blockchain-Inspired Verification:** Every case action (assignment, flagging, narrative generation) is compiled into a cryptographically hashed ledger.
- **Immutable Blocks:** Blocks contain timestamps, investigator IDs, event data, and are chained using SHA-256 hashes back to the system Genesis block.
- **Tamper Detection:** Built-in validation suite instantly audits the entire chain to verify authenticity and pinpoint any unauthorized database edits.

### 3. 👥 Multi-Role Collaborative Workflows
- **Supervisors:** Full administrative dashboard to view all alerts, assign cases to specific investigators, and perform final reviews to "unflag" or escalate flagged accounts.
- **Investigators:** Focused investigation views featuring risk-score breakdowns, transaction timelines, relationship graphs, and automated narrative drafting.

### 4. 📝 AI-Assisted Narrative Generation
- **Automated Case Files:** Dynamically synthesizes transaction histories, alerts, and counterparty metadata to generate comprehensive, professional compliance narratives for regulatory filing.

---

## 🚀 Tech Stack

- **Backend:** FastAPI (Python), Uvicorn, Pydantic, Python-Multiprocessing
- **Frontend:** React, Vite, Framer Motion (smooth, high-end micro-animations), Vanilla CSS (premium dark-mode UI with custom glassmorphism effects)
- **Database:** In-memory high-fidelity seed store with cryptographic verification functions

---

## 🛠️ Getting Started & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Python 3.11+](https://www.python.org/)

---

### Run using Automated Scripts ⚡

The project includes PowerShell scripts in the `scripts` folder to simplify running the prototype locally.

#### 1. Start the Backend
Open a PowerShell terminal and execute:
```powershell
./scripts/run-backend.ps1
```
*This will automatically check for a Python virtual environment, install the dependencies listed in `backend/requirements.txt`, and boot the server at `http://127.0.0.1:8000`.*

#### 2. Start the Frontend
Open a separate PowerShell terminal and execute:
```powershell
./scripts/run-frontend.ps1
```
*This will install the required NPM packages and launch the Vite dev server at `http://127.0.0.1:5173`.*

---

### Manual Setup 🔧

If you prefer to run the components manually, follow the instructions below.

#### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows Activation:
   .\.venv\Scripts\Activate.ps1
   # macOS/Linux Activation:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server using Uvicorn:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

#### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy environment configuration:
   ```bash
   copy .env.example .env
   ```
3. Install packages:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev -- --host 127.0.0.1 --port 5173
   ```

---

## 🔗 Port & API Mappings

- **Frontend Application:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- **Backend API Base:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Backend Health Endpoint:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **Interactive Swagger Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
