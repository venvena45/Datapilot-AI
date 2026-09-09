import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv()
from routers import upload, analyze, export, visualization
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Analytics Dashboard API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(export.router)
app.include_router(visualization.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
