import pandas as pd
import numpy as np
from services.semantic_analyzer import semantic_profile_dataset, infer_semantic_role as detect_semantic_role

def detect_columns(df: pd.DataFrame) -> dict:
    profile = {"columns": [], "row_count": len(df), "total_missing": 0}
    for col in df.columns:
        series = df[col]
        n_unique = series.nunique(dropna=False)
        n_missing = int(series.isnull().sum())
        role = detect_semantic_role(col, series, n_unique, n_missing, len(df))
        profile["columns"].append({
            "name": col,
            "role": role,
            "dtype": str(series.dtype),
            "n_unique": int(n_unique),
            "n_missing": n_missing,
            "count": int(series.count()),
            "sample_values": [str(v)[:50] for v in series.dropna().unique()[:5].tolist()],
            "min": float(series.min()) if pd.api.types.is_numeric_dtype(series) and not series.empty else None,
            "max": float(series.max()) if pd.api.types.is_numeric_dtype(series) and not series.empty else None,
            "mean": float(series.mean()) if pd.api.types.is_numeric_dtype(series) and not series.empty else None,
        })
        profile["total_missing"] += n_missing

    numeric_measures = []
    identifiers = []
    datetime_cols = []
    categorical_cols = []

    for col_info in profile["columns"]:
        col_name = col_info["name"]
        role = col_info["role"]

        if role == "Identifier":
            identifiers.append(col_name)
        elif role == "Time Dimension":
            datetime_cols.append(col_name)
        elif role in ("Dimension", "Boolean", "Geographic"):
            categorical_cols.append(col_name)
        elif role == "Measure":
            numeric_measures.append(col_name)

    if not numeric_measures:
        raw_numeric = df.select_dtypes(include=[np.number]).columns.tolist()
        numeric_measures = [c for c in raw_numeric if c not in identifiers] or raw_numeric

    best_category = None
    if categorical_cols:
        def cat_score(col):
            nu = df[col].nunique()
            if 2 <= nu <= 15:
                return (0, nu)
            return (1, nu)
        sorted_cats = sorted(categorical_cols, key=cat_score)
        best_category = sorted_cats[0]

    best_datetime = datetime_cols[0] if datetime_cols else None
    if not best_datetime:
        for col in df.columns:
            if any(kw in col.lower() for kw in ["date", "time", "year", "month", "day"]):
                best_datetime = col
                break

    return {
        "numeric": numeric_measures,
        "categorical": categorical_cols,
        "identifiers": identifiers,
        "datetime": datetime_cols,
        "best_category": best_category,
        "best_datetime": best_datetime
    }

def compute_stats(df: pd.DataFrame, numeric_cols: list[str]) -> dict:
    stats = {}
    for col in numeric_cols:
        series = df[col]
        std_val = float(series.std()) if not series.empty and not pd.isna(series.std()) else 0.0
        stats[col] = {
            "sum": float(series.sum()),
            "mean": float(series.mean()),
            "std": std_val,
            "min": float(series.min()),
            "max": float(series.max()),
            "count": int(series.count()),
            "null_count": int(series.isnull().sum()),
            "dtype": str(series.dtype)
        }
    return stats

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    df = df.fillna(0)
    return df

def prepare_gemini_prompt(rows, columns, numeric_columns, category_column, stats, file_name) -> str:
    return f"File: {file_name}. Columns: {columns}. Numeric: {numeric_columns}. Stats: {stats}. Provide insights based on this data."
