# Agents for Humans — remaining work

**Short answer:** No. Bedrock credentials are the last piece to make the *agents* real. The app, parsers, Strands code, and wiring are in the repo. You still have Devpost submission work (video, public repo, form) that Bedrock does not cover.

Deadline: **Monday 14 Sep 2026, 5:00 pm Pacific**.

---

## Already true (in this repo)

- Next.js workspace: landing → upload → processing → timeline + chat UI
- Go API: upload, PDF/CSV/WhatsApp parse, Postgres, websocket, timeline endpoint
- Python **Strands Agents** service (`agents/`): supervisor + Timeline / Entity / Claims specialists + investigator tools
- Go calls Strands at `http://127.0.0.1:8000` (`/ingest`, `/extract`)
- Chat calls Strands `/ask` (not the old canned $5,000 reply)
- Sample case: WhatsApp log + bank CSV (`frontend/public/samples/`)
- Apache 2.0 `LICENSE`
- `README.md` with run steps + mermaid architecture diagram
- `.env.example` for AWS / DB / Strands URL

These are **not** connected until Bedrock works:

- Live LLM extraction
- Live investigator answers from evidence

---

## Still to do

### 1. Bedrock (required for the product to count as Strands)

You do this. Then tell me and I can drop it in `.env` and restart `:8000`.

- [ ] AWS credentials **or** Bedrock API key on this machine
- [ ] Region `us-west-2`
- [ ] Enable model **Claude Sonnet 4.6** — ID we use: `global.anthropic.claude-sonnet-4-6`
- [ ] IAM can call `bedrock:InvokeModel` (and streaming)
- [ ] Restart Strands, hit `/health`, run **Load sample case**, ask chat a real question

Until this is done, judges will see a UI + parsers; extract/chat will fail.

### 2. Prove it works (required for the video)

- [ ] Sample case completes processing without hanging
- [ ] Timeline shows dated events (from files and/or Strands)
- [ ] Chat cites the WhatsApp vs $5,000 wire using tools (not a scripted mock)
- [ ] Optional: drop a real PDF and show that path too

### 3. Devpost submission (required — not done by the code)

- [ ] Public GitHub/GitLab/Bitbucket with this repo
- [ ] License visible on the repo (Apache file is local; **push** it)
- [ ] README on the default branch (already written — **push**)
- [ ] Architecture diagram (mermaid in README is enough; screenshot if you want a PNG)
- [ ] Video ≤ 5 min, public YouTube/Vimeo: working demo + pitch (problem, who, why)
- [ ] Devpost text description
- [ ] AWS Builder ID on the form
- [ ] Pick track: **Professional Agents** (this product)
- [ ] Submit before 5:00 pm PT

### 4. Optional (helps scores, skip if short on time)

- [ ] Live demo URL (deploy frontend + APIs)
- [ ] Amazon Bedrock **AgentCore** deploy
- [ ] builder.aws.com post with **Agents for Humans** in the title (up to +0.6)

---

## What you should do vs what I can do

| Item | Who |
|---|---|
| Bedrock API key / IAM keys + model access | **You** |
| Put keys in `.env`, restart agents, smoke-test | Me, once you send the key |
| Record video, fill Devpost, push GitHub | **You** (I can help script/README) |
| AgentCore / live deploy / blog | Only if time after Bedrock works |

**Right now the only technical blocker is Bedrock access.** Everything else in the stack is built; submission packaging is still on you.
