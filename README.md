# Digital Evidence Room

An investigation workspace for lawyers and claims teams. Upload PDFs, CSVs, or WhatsApp exports. A **Strands Agents** team on **Amazon Bedrock** extracts a timeline, entities, and claims, then an investigator agent answers questions using tools over the ingested evidence.

Built for the AWS Agents for Humans hackathon (Professional Agents track).

## Architecture

```mermaid
flowchart LR
  UI[Next.js workspace] -->|upload / timeline / ws| Go[Go API :8080]
  UI -->|ask| Strands[Strands FastAPI :8000]
  Go -->|parse PDF/CSV/TXT| PG[(Postgres)]
  Go -->|ingest + extract| Strands
  Strands --> Bedrock[Amazon Bedrock Claude]
  Strands -->|tools: search / timeline / claims| Store[In-memory case store]
```

Specialist Strands agents (Timeline, Entity, Claims) are invoked as tools by a supervisor agent. The investigator agent uses `search_evidence`, `list_timeline`, and `list_claims`.

## Prerequisites

- Node.js 20+
- Go 1.22+
- Python 3.10+
- Docker (for local Postgres)
- AWS account with Bedrock model access in `us-west-2` (Claude Sonnet 4 / `global.anthropic.claude-sonnet-4-6`)
- IAM permissions: `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream`

## Configure AWS

```powershell
aws configure
# region: us-west-2
```

Or copy `.env.example` to `.env` and set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

Enable the model in **Amazon Bedrock → Model access**.

## Run locally

```powershell
docker run -d --name der-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=evidence -p 5432:5432 postgres:16

# Strands agents
cd agents
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000

# Go API (new terminal)
cd backend
$env:DATABASE_URL="postgres://postgres:postgres@localhost:5432/evidence?sslmode=disable"
$env:STRANDS_URL="http://127.0.0.1:8000"
go run .

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 → Start a new case → **Load sample case** or drop your own files.

## Environment

| Variable | Used by | Default |
|---|---|---|
| `AWS_REGION` | Strands / Bedrock | `us-west-2` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Bedrock | — |
| `BEDROCK_MODEL_ID` | Strands | `global.anthropic.claude-sonnet-4-6` |
| `DATABASE_URL` | Go | required |
| `STRANDS_URL` | Go | `http://127.0.0.1:8000` |

## License

Apache License 2.0. See [LICENSE](LICENSE).
