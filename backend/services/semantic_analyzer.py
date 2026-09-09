import pandas as pd
import numpy as np

def semantic_profile_dataset(df: pd.DataFrame) -> dict:
    profile = {"columns": [], "row_count": len(df), "total_missing": 0}
    for col in df.columns:
        series = df[col]
        n_unique = series.nunique(dropna=False)
        n_missing = int(series.isnull().sum())
        dtype = str(series.dtype)
        sample_values = series.dropna().unique()[:5].tolist()
        
        role = infer_semantic_role(col, series, n_unique, n_missing, len(df))
        
        stats = {
            "name": col,
            "role": role,
            "dtype": dtype,
            "n_unique": int(n_unique),
            "n_missing": n_missing,
            "missing_percentage": round((n_missing / len(df)) * 100, 2) if len(df) > 0 else 0,
            "sample_values": [str(v)[:50] for v in sample_values],
            "min": float(series.min()) if pd.api.types.is_numeric_dtype(series) and not series.empty else None,
            "max": float(series.max()) if pd.api.types.is_numeric_dtype(series) and not series.empty else None,
            "mean": float(series.mean()) if pd.api.types.is_numeric_dtype(series) and not series.empty else None,
        }
        profile["columns"].append(stats)
        profile["total_missing"] += n_missing
    return profile

def infer_semantic_role(col_name: str, series: pd.Series, n_unique: int, n_missing: int, total_rows: int) -> str:
    name_lower = col_name.lower().strip()
    
    id_keywords = ["id", "uuid", "code", "key", "sku", "isbn", "ssn", "phone", "email", "username", "login", "order_id", "customer_id", "product_id", "transaction_id"]
    time_keywords = ["date", "time", "timestamp", "year", "month", "day", "hour", "created_at", "updated_at", "period", "quarter"]
    geo_keywords = ["city", "state", "country", "region", "address", "zip", "postal", "latitude", "longitude", "location", "branch"]
    bool_keywords = ["is_", "has_", "was_", "are_", "enabled", "active", "status", "confirmed", "verified", "approved"]
    text_keywords = ["description", "comment", "note", "message", "address_line", "street", "bio", "summary", "review"]
    measure_keywords = ["price", "amount", "total", "count", "score", "rating", "salary", "revenue", "profit", "cost", "quantity", "value", "balance", "budget", "expense"]

    for kw in time_keywords:
        if kw in name_lower or series.dtype.name.startswith("datetime"):
            return "Time Dimension"

    for kw in id_keywords:
        if kw in name_lower:
            return "Identifier"

    if pd.api.types.is_numeric_dtype(series):
        for mk in measure_keywords:
            if mk in name_lower:
                return "Measure"
        if n_unique > 0 and n_unique / max(total_rows, 1) > 0.95 and n_unique > 50:
            return "Identifier"
        return "Measure"

    for kw in geo_keywords:
        if kw in name_lower:
            return "Geographic"

    for kw in bool_keywords:
        if kw in name_lower or n_unique <= 2:
            return "Boolean"

    for kw in text_keywords:
        if kw in name_lower or n_unique > 50:
            return "Text Description"

    if n_unique <= 30:
        return "Dimension"
    return "Text Description"
