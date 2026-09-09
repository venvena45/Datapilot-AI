import pandas as pd
import numpy as np
from typing import Any
from datetime import datetime

def profile_dataset(df: pd.DataFrame) -> dict:
    profile = {"columns": [], "row_count": len(df), "total_missing": 0}
    for col in df.columns:
        series = df[col]
        n_unique = series.nunique(dropna=False)
        n_missing = int(series.isnull().sum())
        dtype = str(series.dtype)
        sample_values = series.dropna().unique()[:5].tolist()
        stats = {
            "count": int(series.count()),
            "n_unique": int(n_unique),
            "n_missing": n_missing,
            "dtype": dtype,
            "missing_percentage": round((n_missing / len(df)) * 100, 2) if len(df) > 0 else 0,
            "sample_values": [str(v)[:50] for v in sample_values],
            "min": None,
            "max": None,
            "mean": None,
            "std": None,
        }
        if pd.api.types.is_numeric_dtype(series):
            stats["min"] = float(series.min())
            stats["max"] = float(series.max())
            stats["mean"] = float(series.mean()) if not series.empty else 0
            stats["std"] = float(series.std()) if not series.empty else 0
        profile["columns"].append({"name": col, **stats})
        profile["total_missing"] += n_missing
    return profile

def detect_semantic_role(col_name: str, col_stats: dict) -> dict:
    name_lower = col_name.lower().strip()
    role = "unknown"
    confidence = 0.0
    reasoning = []

    numeric_keywords = ["age", "price", "amount", "total", "count", "score", "rating", "salary", "revenue", "profit", "cost", "quantity", "value", "number", "size", "weight", "height", "distance", "speed", "temperature", "population", "income", "balance", "budget", "expense", "discount", "tax", "fee", "rate", "percentage", "ratio"]
    datetime_keywords = ["date", "time", "timestamp", "created_at", "updated_at", "born", "start", "end", "due", "scheduled", "release", "expiry", "expiration", "registration", "submission", "modified"]
    geo_keywords = ["city", "state", "country", "region", "address", "zip", "postal", "latitude", "longitude", "location", "place", "district", "area", "province"]
    id_keywords = ["id", "uuid", "code", "identifier", "key", "sku", "isbn", "ssn", "phone", "email", "username", "login", "user_id", "order_id", "product_id", "customer_id"]
    bool_keywords = ["is_", "has_", "was_", "are_", "will_", "can", "should", "enabled", "active", "status", "confirmed", "verified", "approved", "deleted", "complete", "finished", "success", "fail"]
    text_keywords = ["description", "comment", "note", "message", "address_line", "street", "bio", "summary", "review", "feedback", "remark", "content"]

    for kw in datetime_keywords:
        if kw in name_lower:
            role = "datetime"
            confidence = 0.9
            reasoning.append(f"Column name '{col_name}' contains datetime keyword '{kw}'")
            break

    if role == "unknown":
        for kw in geo_keywords:
            if kw in name_lower:
                role = "geographic"
                confidence = 0.85
                reasoning.append(f"Column name '{col_name}' contains geographic keyword '{kw}'")
                break

    if role == "unknown":
        if col_stats["dtype"].startswith(("int", "float")):
            for kw in id_keywords:
                if kw in name_lower:
                    role = "identifier"
                    confidence = 0.9
                    reasoning.append(f"Numeric column '{col_name}' has ID-like name '{kw}'")
                    break
            if role == "unknown" and col_stats["n_unique"] == len([c for c in [1] ]) == 0:
                pass
            if role == "unknown":
                if col_stats["n_unique"] > 0 and col_stats["n_unique"] / max(col_stats["count"], 1) > 0.95:
                    role = "identifier"
                    confidence = 0.8
                    reasoning.append(f"Numeric column '{col_name}' has very high cardinality ({col_stats['n_unique']}/{col_stats['count']})")
        elif col_stats["dtype"] == "object":
            for kw in id_keywords:
                if kw in name_lower:
                    role = "identifier"
                    confidence = 0.85
                    reasoning.append(f"Text column '{col_name}' has ID-like name '{kw}'")
                    break
            if role == "unknown":
                for kw in bool_keywords:
                    if kw in name_lower:
                        role = "boolean"
                        confidence = 0.85
                        reasoning.append(f"Column '{col_name}' has boolean keyword '{kw}'")
                        break
                if role == "unknown" and col_stats["n_unique"] <= 2:
                    role = "boolean"
                    confidence = 0.8
                    reasoning.append(f"Column '{col_name}' has only {col_stats['n_unique']} unique values suggesting boolean")
                if role == "unknown":
                    for kw in text_keywords:
                        if kw in name_lower:
                            role = "text_description"
                            confidence = 0.85
                            reasoning.append(f"Column '{col_name}' has text keyword '{kw}'")
                            break
                    if role == "unknown" and col_stats["n_unique"] > 50:
                        role = "identifier"
                        confidence = 0.7
                        reasoning.append(f"Column '{col_name}' has high cardinality ({col_stats['n_unique']} unique) suggesting identifier")
        elif col_stats["dtype"].startswith("datetime"):
            role = "datetime"
            confidence = 0.95
            reasoning.append(f"Column '{col_name}' has datetime dtype")

    if role == "unknown":
        if col_stats["dtype"].startswith(("int", "float")):
            role = "numeric_measure"
            confidence = 0.6
            reasoning.append(f"Column '{col_name}' is numeric but no specific role detected")
        elif col_stats["dtype"] == "object":
            if col_stats["n_unique"] <= 20:
                role = "categorical_dimension"
                confidence = 0.65
                reasoning.append(f"Column '{col_name}' is categorical with {col_stats['n_unique']} unique values")
            else:
                role = "text_description"
                confidence = 0.5
                reasoning.append(f"Column '{col_name}' has many unique string values")

    return {
        "role": role,
        "confidence": confidence,
        "reasoning": reasoning,
        "is_numeric_measure": role in ("numeric_measure",),
        "is_datetime": role == "datetime",
        "is_categorical": role in ("categorical_dimension", "boolean"),
        "is_identifier": role == "identifier",
        "is_geographic": role == "geographic",
        "is_text": role in ("text_description",),
        "should_ignore": role == "identifier",
    }
