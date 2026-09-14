# Digital Evidence Room

An AI-powered investigation workspace for lawyers, claims adjusters, and investigative teams. 

Built for the **AWS Agents for Humans Hackathon (Professional Agents track)**.

## Why We Built This
The discovery process in modern legal and insurance cases is broken. Investigators spend hundreds of hours manually reviewing unstructured evidence like WhatsApp chat exports, bank statements, and scanned PDFs. Human reviewers get tired, and it is incredibly easy to miss a crucial contradiction hidden across different document types. 

The Digital Evidence Room solves this by acting as an AI paralegal that never sleeps. It automatically cross-references documents, flags contradictions, and builds a comprehensive case profile instantly.

## Why This Approach Works
Instead of using one massive AI prompt that easily gets confused, we built a **Multi-Agent Architecture** powered by AWS Bedrock. 

When you upload evidence, a Supervisor Agent orchestrates three distinct Specialist Agents:
1. **The Timeline Agent:** Extracts every dated event into a chronological master timeline.
2. **The Entity Agent:** Maps out every person, organization, and account mentioned.
3. **The Claims Agent:** Identifies factual assertions and explicitly flags when two pieces of evidence contradict each other.

By breaking down the task, we drastically improved extraction accuracy and reduced AI hallucinations. Finally, an **Investigator Agent** provides a chat interface to interrogate the evidence, using the extracted JSON data and semantic search to provide concise answers with exact source citations.

## Architecture

![Architecture Diagram](architecture.jpg)

The system uses a decoupled, microservice-based architecture:
*   **Next.js Frontend:** A responsive workspace UI.
*   **Go Backend API:** Handles high-performance file parsing, WebSocket connections for real-time chat, and PostgreSQL ingestion.
*   **Python Agent Service:** A FastAPI service powered by the Strands framework to handle AWS Bedrock LLM orchestrations.

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
