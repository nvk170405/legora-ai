# Legora AI

> AI-powered contract analysis platform — summarize, extract, question, and assess risk.

Legora AI reduces contract review time for legal and procurement teams by combining a fine-tuned LLaMA model with retrieval-augmented generation, rule-based guardrails, and human-in-the-loop review workflows.

## Architecture

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS |
| **Backend** | FastAPI, SQLAlchemy, Celery |
| **Database** | PostgreSQL 16 + pgvector |
| **Cache** | Redis |
| **Storage** | MinIO (S3-compatible) |
| **AI/RAG** | LangChain, sentence-transformers, OpenAI/Groq |
| **ML Pipeline** | LoRA/QLoRA, MLflow, HuggingFace |
| **Infrastructure** | Docker Compose (dev), Kubernetes (prod) |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ & pnpm 9+
- Python 3.12+

### Setup

```bash
# Clone the repo
git clone https://github.com/your-org/legora-ai.git
cd legora-ai

# Copy environment config
cp .env.example .env
# Edit .env with your API keys (OPENAI_API_KEY or GROQ_API_KEY)

# Start infrastructure (DB, Redis, MinIO)
docker compose -f infra/docker/docker-compose.yml up db redis minio minio-setup -d

# Start backend
cd apps/api
pip install -e ".[dev]"
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# Start frontend (in another terminal)
cd apps/web
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the web app and [http://localhost:8000/docs](http://localhost:8000/docs) for the API docs.

### Docker Compose (Full Stack)

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

## Project Structure

```
legora-ai/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # FastAPI backend
├── ml/               # ML training pipeline
├── infra/            # Docker, K8s, Terraform
├── docs/             # Documentation
└── packages/         # Shared packages
```

## API Endpoints

| Method | Path | Description |
|:---|:---|:---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/contracts/upload` | Upload a contract |
| GET | `/api/contracts/` | List contracts |
| POST | `/api/documents/{id}/process` | Process a document |
| POST | `/api/analysis/{id}/summarize` | Summarize a contract |
| POST | `/api/analysis/{id}/extract-clauses` | Extract clauses |
| POST | `/api/analysis/{id}/ask` | Ask a question (RAG Q&A) |
| POST | `/api/analysis/{id}/assess-risk` | Assess risk |
| GET | `/api/review/{id}/items` | Get review items |
| PATCH | `/api/review/items/{id}` | Submit review decision |
| GET | `/api/audit/logs` | Query audit logs |

## ML Pipeline

```bash
cd ml

# Prepare dataset
python training/scripts/prepare_data.py --config training/config/lora_config.yaml

# Fine-tune with LoRA/QLoRA
python training/scripts/train_lora.py --config training/config/lora_config.yaml

# Evaluate
python training/scripts/evaluate.py --model-path models/legora-legal-lora/final
```

## License

Private — All rights reserved.
