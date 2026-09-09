import pandas as pd
import numpy as np
from typing import Any

def generate_chart_data(df: pd.DataFrame, x_axis: str, y_axis: str, group_by: str = None, chart_type: str = "bar") -> dict:
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    if x_axis not in df.columns:
        return {"error": f"x_axis '{x_axis}' not in columns"}
    if y_axis not in df.columns:
        return {"error": f"y_axis '{y_axis}' not in columns"}
    if y_axis not in numeric_cols:
        return {"error": f"y_axis '{y_axis}' is not numeric"}

    chart_data = []
    chart_title = f"{y_axis} by {x_axis}" if x_axis != y_axis else f"{y_axis} distribution"
    detected_chart_type = chart_type

    if group_by and group_by in df.columns:
        categories = df[group_by].unique()[:10]
        for cat in categories:
            subset = df[df[group_by] == cat]
            grouped = subset.groupby(x_axis)[y_axis].sum().reset_index()
            chart_data.append({
                "series_name": str(cat),
                "data": grouped.to_dict(orient="records")
            })
        detected_chart_type = "bar"
    else:
        if df[x_axis].dtype == 'object' or df[x_axis].dtype.name == 'category':
            grouped = df.groupby(x_axis)[y_axis].agg(["sum", "mean", "count"]).reset_index()
            grouped.columns = [x_axis, f"{y_axis}_sum", f"{y_axis}_mean", f"{y_axis}_count"]
            chart_data = grouped.to_dict(orient="records")
            detected_chart_type = "bar"
        else:
            sorted_df = df.sort_values(x_axis)
            chart_data = sorted_df[[x_axis, y_axis]].head(500).to_dict(orient="records")
            detected_chart_type = "line"

    if not chart_data:
        return {"error": "No data to chart"}

    stats = {
        "y_sum": float(df[y_axis].sum()),
        "y_mean": float(df[y_axis].mean()),
        "y_min": float(df[y_axis].min()),
        "y_max": float(df[y_axis].max()),
        "y_std": float(df[y_axis].std()) if df[y_axis].std() == df[y_axis].std() else 0,
        "row_count": len(df),
        "unique_x": int(df[x_axis].nunique()),
    }

    return {
        "chart_type": detected_chart_type,
        "chart_title": chart_title,
        "chart_data": chart_data,
        "stats": stats,
        "x_axis": x_axis,
        "y_axis": y_axis,
        "group_by": group_by,
    }

def generate_donut_data(df: pd.DataFrame, category_col: str, numeric_col: str) -> dict:
    if category_col not in df.columns or numeric_col not in df.columns:
        return {"error": "Invalid columns"}
    grouped = df.groupby(category_col)[numeric_col].sum().reset_index()
    total = grouped[numeric_col].sum()
    data = []
    for _, row in grouped.head(8).iterrows():
        pct = round((row[numeric_col] / total) * 100, 1) if total > 0 else 0
        data.append({
            "name": str(row[category_col]),
            "value": float(row[numeric_col]),
            "percentage": pct
        })
    return {
        "category_column": category_col,
        "numeric_column": numeric_col,
        "total": float(total),
        "data": data,
    }

def generate_kpi_summary(df: pd.DataFrame, numeric_columns: list) -> dict:
    kpis = []
    for col in numeric_columns[:4]:
        series = df[col]
        if series.dtype not in ('int64', 'float64'):
            continue
        stats = {
            "column_name": col,
            "sum": float(series.sum()),
            "mean": float(series.mean()),
            "min": float(series.min()),
            "max": float(series.max()),
            "count": int(series.count()),
            "std": float(series.std()) if series.std() == series.std() else 0,
            "q25": float(series.quantile(0.25)),
            "q75": float(series.quantile(0.75)),
        }
        kpis.append(stats)
    return {"kpis": kpis}
