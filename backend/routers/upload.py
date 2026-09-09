import io
from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from utils.helpers import detect_columns, compute_stats, preprocess_data

router = APIRouter(prefix="/api")

db = {"data": None, "filename": None, "stats": None, "columns": None, "numeric_columns": None, "categorical_columns": None, "total_missing": 0, "insight": None, "category_column": None, "datetime_column": None}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
    except Exception as e:
        try:
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
            elif file.filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(io.BytesIO(contents))
            elif file.filename.endswith('.json'):
                df = pd.read_json(io.StringIO(contents.decode('utf-8')))
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")
        except Exception as inner_e:
            raise HTTPException(status_code=400, detail=str(inner_e))

    df = preprocess_data(df)
    cols = detect_columns(df)
    stats = compute_stats(df, cols["numeric"])

    db["data"] = df
    db["filename"] = file.filename
    db["stats"] = stats
    db["columns"] = df.columns.tolist()
    db["numeric_columns"] = cols["numeric"]
    db["categorical_columns"] = cols["categorical"]
    db["datetime_column"] = cols.get("best_datetime")
    db["total_missing"] = int(df.isnull().sum().sum())

    category_column = cols.get("best_category") or (cols["categorical"][0] if cols["categorical"] else None)
    db["category_column"] = category_column
    preview = df.head(50).to_dict(orient="records")

    return {
        "filename": file.filename,
        "rows": len(df),
        "column_count": len(df.columns),
        "columns": df.columns.tolist(),
        "numeric_columns": cols["numeric"],
        "category_column": category_column,
        "datetime_column": cols.get("best_datetime"),
        "stats": stats,
        "preview": preview
    }
