from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    api_key: str
    model_name: str = "gemini-1.5-flash"

class InsightRequest(BaseModel):
    api_key: str
    model_name: str = "gemini-1.5-flash"

class ExportRequest(BaseModel):
    format: str

class ColumnStats(BaseModel):
    sum: Optional[float]
    mean: Optional[float]
    min: Optional[float]
    max: Optional[float]
    count: int
    null_count: int
    dtype: str

class UploadResponse(BaseModel):
    filename: str
    row_count: int
    column_count: int
    columns: List[str]
    numeric_columns: List[str]
    category_columns: List[str]
    stats: Dict[str, ColumnStats]
    sample_data: List[Dict[str, Any]]
