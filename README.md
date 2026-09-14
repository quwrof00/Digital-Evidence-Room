# Digital Evidence Room

An AI-powered investigation workspace for lawyers, claims adjusters, and investigative teams. 

Built for the **AWS Agents for Humans Hackathon (Professional Agents track)**.

## Why We Built This
The discovery process in modern legal and insurance cases is broken. Investigators spend hundreds of hours manually reviewing unstructured evidence like WhatsApp chat exports, bank statements, and scanned PDFs. Human reviewers get tired, and it is incredibly easy to miss a crucial contradiction hidden across different document types. 

The Digital Evidence Room solves this by acting as an AI paralegal that never sleeps. It automatically cross-references documents, flags contradictions, and builds a comprehensive case profile instantly.

## The Microservice Architecture
We intentionally built a decoupled, polyglot architecture to leverage the best tool for every specific job:

### 1. The Core API (Go)
We chose **Go (Golang)** for our primary backend API because of its unmatched concurrency model (`goroutines`) and low memory footprint. Parsing large PDFs, sweeping through thousands of CSV rows, and handling multiple concurrent document uploads requires heavy, fast I/O. Go handles this background file ingestion effortlessly. Its strong typing (via GORM) guarantees that our PostgreSQL database layer remains perfectly structured and never drops evidence.

### 2. The Agent Orchestrator (Python + Strands)
We chose **Python** for the AI layer because its data science and LLM ecosystem is the industry standard. We built a fast, stateless FastAPI service powered by the **Strands** framework to handle AWS Bedrock LLM orchestrations.

Instead of using one massive AI prompt that easily gets confused, we built a **Multi-Agent Architecture**:
*   **The Timeline Agent:** Extracts every dated event into a chronological master timeline.
*   **The Entity Agent:** Maps out every person, organization, and account mentioned.
*   **The Claims Agent:** Identifies factual assertions and explicitly flags when two pieces of evidence contradict each other.

By breaking down the task into specialized agents, we drastically improved extraction accuracy and reduced AI hallucinations. Finally, an **Investigator Agent** provides a conversational interface to interrogate the evidence.

### 3. The Workspace UI (Next.js)
We chose **Next.js (React)** for a beautiful, responsive, and robust frontend. Combined with Tailwind CSS and Framer Motion, it delivers a premium, highly-interactive "Digital Evidence Room" experience that investigators will actually enjoy using. 

## Key Features
*   **Multi-Case Workspaces:** Investigators can create and manage multiple cases simultaneously, persisted via local session storage.
*   **Incremental Uploads:** Append new evidence to an ongoing case at any time.
*   **Robust Error Fallbacks:** If AWS Bedrock rate limits or permissions fail, the UI gracefully catches the errors and provides helpful fallback banners.
*   **Interactive Mock Sample Case:** A fully hardcoded, instant-load Sample Case guarantees a perfect demonstration of the app's capabilities for judges, even without backend connectivity.

## Prerequisites

*   Node.js 20+
*   Go 1.22+
*   Python 3.10+
*   Docker (for local Postgres database)
*   AWS account with Bedrock model access

## Configure AWS

1. Copy `.env.example` to `.env`
2. Set your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
3. By default, the app uses Meta Llama 3.1 70B (`meta.llama3-1-70b-instruct-v1:0`). Ensure you have requested access to this model in **Amazon Bedrock -> Model access**.

## Run Locally

**1. Start the Database**
```bash
docker run -d --name der-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=evidence -p 5432:5432 postgres:16
```

**2. Start the Python Strands Agents**
```bash
cd agents
python -m venv .venv
# Activate the venv (Windows: .\.venv\Scripts\Activate.ps1)
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

**3. Start the Go API (in a new terminal)**
```bash
cd backend
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/evidence?sslmode=disable"
export STRANDS_URL="http://127.0.0.1:8000"
go run .
```

**4. Start the Frontend (in a new terminal)**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 to start investigating!

## License
Apache License 2.0. See [LICENSE](LICENSE).
