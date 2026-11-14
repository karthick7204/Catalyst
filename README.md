# Catalyst: Production AI Coding Agent

Catalyst is an autonomous software engineering AI agent that bridges **Linear** issue tracking with **GitHub** repositories. When an issue or bug is created/triaged in Linear, Catalyst:
1. Catches the issue description and GitHub repository via webhook.
2. Clones the codebase into an isolated ephemeral sandbox.
3. Investigates the problem, reproduces the bug, and implements a fix using an LLM equipped with codebase tools (MCP).
4. Verifies the fix with automated test execution and generates a clean git diff.
5. Requests **Human-in-the-Loop (HITL)** approval directly inside the Linear issue.
6. Upon human approval, pushes the branch and creates a GitHub Pull Request, linking it back to Linear.

---

## 🏗️ Architecture

```
[Linear Webhook] ──► [Catalyst Ingestor (Fastify)] ──► [BullMQ Queue (Redis)]
                                                              │
                                                              ▼
                                                    [Catalyst Worker]
                                                              │
                                        ┌─────────────────────┴─────────────────────┐
                                        │ Ephemeral Workspace Sandbox               │
                                        │ - Git Clone with GitHub App Token         │
                                        │ - AI ReAct Loop with Codebase Tools (MCP) │
                                        │ - Automated Test & Linter Execution       │
                                        └─────────────────────┬─────────────────────┘
                                                              │
                                                              ▼
                                              [Human Approval Request on Linear]
                                                              │
                                          [User clicks "Approve & Push PR"]
                                                              │
                                                              ▼
                                            [Git Push & GitHub PR Created]
                                            [Linear Issue -> "In Review"]
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+
- **Docker**: For running Postgres and Redis (`docker-compose up -d`)
- **Linear Account**: With Admin / Team permissions to configure webhooks
- **GitHub Account / App**: Scoped repository permissions

### 2. Start Supporting Services
```bash
docker-compose up -d
```
This spins up PostgreSQL (`localhost:5432`) and Redis (`localhost:6379`).

### 3. Install Dependencies
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

### 4. Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
- `LINEAR_WEBHOOK_SECRET` & `LINEAR_API_KEY`
- `GITHUB_APP_*` (or `GITHUB_TOKEN` for development)
- `GEMINI_API_KEY` (or Anthropic/OpenAI)

### 5. Run Server & Worker
```bash
npm run dev
```

---

## 🔌 Linear Webhook Setup
1. In Linear, go to **Settings > API > Webhooks**.
2. Click **New Webhook**.
3. Set **URL** to: `https://your-domain.com/webhooks/linear`
4. Set **Resource Types**: `Issues`.
5. Copy the Signing Secret and set it as `LINEAR_WEBHOOK_SECRET` in `.env`.

When creating a bug ticket in Linear, simply paste the GitHub repository link (e.g. `https://github.com/my-org/my-repo`) anywhere in the issue description. Catalyst will automatically detect it, clone the code, prepare the fix, and post an interactive comment with the diff and approval button!

