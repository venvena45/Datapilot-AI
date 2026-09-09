# NexusAnalytics — AI Data Dashboard

Self-service Business Intelligence dashboard powered by Google Gemini AI. Upload data files (CSV, Excel, JSON) to get automatic profiling, visualizations, BI reports, and AI-driven conversational insights.

---

## Key Features

| Feature | Description |
|-------|-----------|
| **Data Upload** | Drag-and-drop CSV, XLSX, JSON — auto-detects column roles (Measure, Dimension, Time, Geographic, etc.) |
| **Overview** | KPI cards, trend charts, donut charts, AI insight panel, and PDF/DOCX export |
| **Trend Analysis** | Full-width trend visualization + categorical distribution |
| **Raw Data** | Searchable, paginated data table |
| **AI Insights** | Comprehensive BI report: Executive Summary, Key Findings, Business Insights, Strategic Recommendations, Risks, Opportunities, and KPIs |
| **AI Chat** | Conversational AI assistant for data queries (with response caching) |
| **Export** | Download generated reports as PDF or DOCX |

---

## Tech Stack

**Frontend** (React + Vite + TypeScript)
- React 18, TypeScript 5, Vite 6
- Tailwind CSS (custom dark theme)
- Recharts for visualizations
- react-dropzone, react-markdown, lucide-react

**Backend** (FastAPI + Python)
- FastAPI + Uvicorn
- Pandas, NumPy for data processing
- Google Generative AI SDK (Gemini)
- ReportLab (PDF), python-docx (DOCX)
- Pydantic for validation

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google Gemini API Key (get it at [Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_NAME=gemini-2.5-flash
```

Start the backend server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```
API is available at `http://localhost:8000` — Swagger docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173` — `/api/*` requests are automatically proxied to port 8000.

---

## Project Structure

```
Dashboard/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # 14 UI components (FileUpload, KPICards, Charts, AIChat, etc.)
│   │   ├── hooks/            # Custom hooks (useFileUpload, useAnalysis, useChat, useAITrend)
│   │   ├── store/            # React Context + useReducer (dataStore)
│   │   ├── api/client.ts     # All API calls
│   │   └── types/index.ts    # TypeScript interfaces
│   └── package.json
│
└── backend/                  # FastAPI
    ├── routers/              # upload, analyze, export, visualization
    ├── services/             # gemini_service, ai_recommender, semantic_analyzer,
                              # profiler, chart_engine, report_service, validator
    ├── models/schemas.py     # Pydantic models
    ├── utils/helpers.py      # detect_columns, compute_stats, preprocess_data
    ├── main.py               # Entry point + CORS
    └── requirements.txt
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-----------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload CSV/XLSX/JSON |
| `/api/analyze/eda` | GET | Exploratory Data Analysis |
| `/api/analyze/data` | GET | Paginated data retrieval |
| `/api/analyze/insight` | POST | Generate AI/rule-based insights |
| `/api/analyze/chat` | POST | AI chat about dataset |
| `/api/analyze/explain-chart` | POST | AI chart explanation |
| `/api/analyze/config` | GET | Check API key status |
| `/api/analyze/columns` | GET | Column metadata |
| `/api/analyze/trend-column` | POST | AI trend column selection |
| `/api/analyze/trend` | GET | Full trend data |
| `/api/visualization/full` | POST | Full visualization pipeline |
| `/api/export/pdf` | POST | Export PDF |
| `/api/export/docx` | POST | Export DOCX |

---

## Usage Guide

1. **Open** `http://localhost:5173`
2. **Enter API Key** in the sidebar (or ensure it's in `.env`) and select a Gemini model.
3. **Upload** your data file via the drag-and-drop area.
4. **Explore tabs**:
   - **Overview** — KPI summary + charts + AI insights.
   - **Trends** — Detailed trend analysis.
   - **Data** — View raw data.
   - **Insights** — Full BI report.
   - **Chat** — AI Q&A about your data.
5. **Export** reports via the Export panel (PDF/DOCX).

---

## Environment Variables

File: `backend/.env`

| Variable | Example | Description |
|----------|--------|--------|
| `GEMINI_API_KEY` | `sk-xxx` | Google Gemini API Key |
| `GEMINI_MODEL_NAME` | `gemini-2.5-flash` | Selected AI model |

Available models (selectable in sidebar):
- `gemini-2.5-flash` (default, fast)
- `gemini-2.5-pro` (more intelligent)
- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`

---

## AI Fallback Mechanism

All AI endpoints include a rule-based fallback:
- If Gemini fails (quota, invalid key, network) → automatically switches to heuristic-based analysis.
- Chat fallback handles common intents: KPI, risk, strategy, trend, ranking, and correlation.

---

## Production Build

```bash
# Frontend
cd frontend && npm run build
# Output in frontend/dist/

# Backend
cd backend && pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## License

Internal project — NexusAnalytics AI Data Studio.