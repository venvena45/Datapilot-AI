# NexusAnalytics — AI Data Dashboard

Dashboard Business Intelligence self-service yang dipakai Google Gemini AI. Upload file data (CSV, Excel, JSON) → dapatkan analisis otomatis, visualisasi, laporan BI, dan chat AI tentang dataset Anda.

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Upload Data** | Drag-and-drop CSV, XLSX, JSON — auto-deteksi kolom (Measure, Dimension, Time, Geographic, dll.) |
| **Overview** | KPI cards, trend chart, donut chart, AI insight panel, export PDF/DOCX |
| **Trend Analysis** | Visualisasi tren full-width + distribusi kategori |
| **Raw Data** | Tabel data paginated dengan pencarian |
| **AI Insights** | Laporan BI lengkap: Executive Summary, Key Findings, Business Insights, Strategic Recommendations, Risks, Opportunities, KPIs |
| **AI Chat** | Tanya jawab conversasional tentang data (cache response untuk efisiensi) |
| **Export** | Download laporan sebagai PDF atau DOCX |

---

## Tech Stack

**Frontend** (React + Vite + TypeScript)
- React 18, TypeScript 5, Vite 6
- Tailwind CSS (custom dark theme)
- Recharts untuk visualisasi
- react-dropzone, react-markdown, lucide-react

**Backend** (FastAPI + Python)
- FastAPI + Uvicorn
- Pandas, NumPy untuk proses data
- Google Generative AI SDK (Gemini)
- ReportLab (PDF), python-docx (DOCX)
- Pydantic validasi

---

## Quick Start

### Prasyarat
- Node.js 18+
- Python 3.10+
- Google Gemini API Key (dapatkan di [Google AI Studio](https://aistudio.google.com/))

### 1. Clone & Setup Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
```

Buat file `.env` di folder `backend/`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_NAME=gemini-2.5-flash
```

Jalankan server backend:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```
API tersedia di `http://localhost:8000` — docs Swagger: `http://localhost:8000/docs`

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend jalan di `http://localhost:5173` — proxy `/api/*` otomatis ke backend port 8000.

---

## Struktur Proyek

```
Dashboard/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # 14 komponen UI (FileUpload, KPICards, Charts, AIChat, dll.)
│   │   ├── hooks/            # Custom hooks (useFileUpload, useAnalysis, useChat, useAITrend)
│   │   ├── store/            # React Context + useReducer (dataStore)
│   │   ├── api/client.ts     # Semua panggilan API
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

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload CSV/XLSX/JSON |
| `/api/analyze/eda` | GET | Exploratory Data Analysis |
| `/api/analyze/data` | GET | Data paginated |
| `/api/analyze/insight` | POST | Generate AI/rule-based insight |
| `/api/analyze/chat` | POST | Chat AI tentang dataset |
| `/api/analyze/explain-chart` | POST | Penjelasan chart AI |
| `/api/analyze/config` | GET | Cek status API key |
| `/api/analyze/columns` | GET | Metadata kolom |
| `/api/analyze/trend-column` | POST | AI pilih kolom trend |
| `/api/analyze/trend` | GET | Data trend lengkap |
| `/api/visualization/full` | POST | Pipeline visualisasi penuh |
| `/api/export/pdf` | POST | Export PDF |
| `/api/export/docx` | POST | Export DOCX |

---

## Cara Pakai

1. **Buka** `http://localhost:5173`
2. **Masukkan API Key** di sidebar (atau sudah di `.env`) → pilih model Gemini
3. **Upload file** data via drag-and-drop area
4. **Explore tabs**:
   - **Overview** — ringkasan KPI + chart + insight AI
   - **Trends** — analisis tren detail
   - **Data** — lihat data mentah
   - **Insights** — laporan BI lengkap
   - **Chat** — tanya AI tentang data
5. **Export** laporan via panel Export (PDF/DOCX)

---

## Environment Variables

File: `backend/.env`

| Variable | Contoh | Fungsi |
|----------|--------|--------|
| `GEMINI_API_KEY` | `sk-xxx` | API Key Google Gemini |
| `GEMINI_MODEL_NAME` | `gemini-2.5-flash` | Model yang dipakai |

Model tersedia (pilih di sidebar):
- `gemini-2.5-flash` (default, cepat)
- `gemini-2.5-pro` (lebih cerdas)
- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`

---

## Fallback AI

Semua endpoint AI punya fallback rule-based:
- Kalau Gemini error (quota, no key, network) → otomatis pakai aturan heuristik
- Chat fallback handle intent: KPI, risk, strategy, trend, ranking, correlation

---

## Build Production

```bash
# Frontend
cd frontend && npm run build
# Output di frontend/dist/

# Backend
cd backend && pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## Lisensi

Internal project — NexusAnalytics AI Data Studio.