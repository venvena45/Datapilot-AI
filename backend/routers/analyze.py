import os
from fastapi import APIRouter, HTTPException, Query, Body
from services.gemini_service import generate_insight, chat_with_gemini, explain_chart, rule_based_insight, _clean_text
from services.semantic_analyzer import semantic_profile_dataset
from utils.helpers import compute_stats, detect_columns
from routers.upload import db
import pandas as pd
import numpy as np
from numbers import Number

router = APIRouter(prefix="/api/analyze")

@router.get("/eda")
def get_eda():
    if db["data"] is None:
        raise HTTPException(status_code=400, detail="No data uploaded")
    df = db["data"]
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    correlations = df[numeric_cols].corr().to_dict() if numeric_cols else {}
    return {
        "stats": db["stats"],
        "correlations": correlations
    }

@router.get("/data")
def get_data(page: int = Query(1, ge=1), limit: int = Query(10, ge=1)):
    if db["data"] is None:
        raise HTTPException(status_code=400, detail="No data uploaded")
    df = db["data"]
    start = (page - 1) * limit
    end = start + limit
    paginated = df.iloc[start:end]
    return {
        "total": len(df),
        "page": page,
        "limit": limit,
        "data": paginated.to_dict(orient="records")
    }

@router.post("/insight")
def get_insight(req: dict = Body(default={})):
    if db["data"] is None:
        raise HTTPException(status_code=400, detail="No data uploaded")
    api_key = req.get("api_key")
    model_name = req.get("model_name", "gemini-2.5-flash")
    df = db["data"]
    profile = semantic_profile_dataset(df)
    context = f"Stats: {db['stats']}, Columns: {db['columns']}"
    result = generate_insight(api_key, model_name, context)
    if result["success"]:
        insight_text = _clean_text(result["text"])
        db["insight"] = insight_text
        return {"insight": insight_text, "source": "gemini"}
    fallback = _clean_text(rule_based_insight(profile, db["stats"], df=df))
    db["insight"] = fallback
    return {"insight": fallback, "source": "rule_based", "ai_error": result["text"]}

@router.post("/chat")
def chat_ai(req: dict = Body(default={})):
    if db["data"] is None:
        raise HTTPException(status_code=400, detail="No data uploaded")
    api_key = req.get("api_key")
    model_name = req.get("model_name", "gemini-2.5-flash")
    messages = req.get("messages", [])
    df = db["data"]
    profile = semantic_profile_dataset(df)
    stats = db["stats"]
    user_msg = messages[-1].get("content", "").lower() if messages else ""
    result = chat_with_gemini(api_key, model_name, messages, f"Stats: {stats}, Columns: {db['columns']}")
    if result["success"]:
        return {"response": result["text"], "source": "gemini"}
    measures = [c for c in profile.get("columns", []) if c["role"] == "Measure"]
    dims = [c for c in profile.get("columns", []) if c["role"] in ("Dimension", "Geographic", "Time Dimension")]
    numeric_cols = db["numeric_columns"]
    total_rows = len(df)
    name = db["filename"] or "this dataset"

    def fmt(col):
        s = stats.get(col, {})
        return f"mean {s.get('mean',0):,.1f}, min {s.get('min',0):,.1f}, max {s.get('max',0):,.1f}"

    if "hello" in user_msg or "hi" in user_msg or "hey" in user_msg or "greeting" in user_msg:
        m_summary = f" with measures {', '.join(m['name'] for m in measures[:3])} and dimensions {', '.join(d['name'] for d in dims[:3])}" if measures and dims else ""
        fallback = f"Hello! I'm your AI Business Consultant. I've loaded {name} with {total_rows:,} rows and {len(df.columns)} columns.{m_summary}. Feel free to ask me about strategies, trends, risks, or KPIs for your data!"
    elif "kpi" in user_msg or "key performance" in user_msg:
        if measures:
            kpi_lines = [f"Based on {name}, here are the KPIs you should monitor:"]
            for m in measures[:3]:
                kpi_lines.append(f"- {m['name']} Growth Rate: Track how this metric changes over time to measure performance.")
                if dims:
                    kpi_lines.append(f"- {m['name']} Concentration by {dims[0]['name']}: Understand which segment drives most of this metric.")
            kpi_lines.append(f"\nKey numbers: {fmt(measures[0]['name']) if measures else 'N/A'}")
            fallback = "\n".join(kpi_lines)
        else:
            fallback = f"No numeric measures found in {name}. Please upload a dataset with numeric columns to generate KPI recommendations."
    elif "risk" in user_msg or "risks" in user_msg or "danger" in user_msg or "problem" in user_msg:
        risk_lines = ["Here's a quick risk assessment:"]
        if total_rows < 30:
            risk_lines.append(f"- Small dataset: only {total_rows} rows may not provide statistically significant conclusions.")
        if db.get("total_missing", 0) > 0:
            risk_lines.append(f"- Data quality: {db['total_missing']} missing values detected, which may bias analysis.")
        for col in numeric_cols[:2]:
            try:
                q1, q3 = df[col].quantile(0.25), df[col].quantile(0.75)
                iqr = q3 - q1
                outliers = len(df[(df[col] < q1 - 1.5*iqr) | (df[col] > q3 + 1.5*iqr)])
                if outliers > 0:
                    risk_lines.append(f"- Outliers: {outliers} records ({round(outliers/total_rows*100,1)}%) in {col} may distort averages.")
            except Exception:
                pass
        if not any("Small dataset" in r or "Data quality" in r or "Outliers" in r for r in risk_lines):
            risk_lines.append("- No significant data quality risks detected.")
        fallback = "\n".join(risk_lines)
    elif "recommend" in user_msg or "strateg" in user_msg or "strategy" in user_msg or "suggest" in user_msg or "advice" in user_msg:
        if measures and dims:
            m_name, d_name = measures[0]["name"], dims[0]["name"]
            if m_name in df.columns and d_name in df.columns:
                agg = df.groupby(d_name)[m_name].sum().sort_values(ascending=False)
                total = agg.sum()
                if total > 0:
                    top_cat = agg.index[0]
                    top_pct = round(agg.iloc[0] / total * 100, 1)
                    bottom_cat = agg.index[-1]
                    bottom_pct = round(agg.iloc[-1] / total * 100, 1)
                    gap = round(top_pct - bottom_pct, 1)
                    fallback = f"Here are strategic recommendations for {name}:\n\n- Increase '{bottom_cat}' contribution: currently only {bottom_pct}% of total {m_name}. Invest in targeted campaigns to improve market share.\n- The gap between {top_cat} ({top_pct}%) and {bottom_cat} ({bottom_pct}%) is {gap}pp, indicating significant concentration risk.\n- Consider diversifying to reduce dependency on {top_cat}."
                else:
                    fallback = "Unable to generate strategic recommendations due to insufficient data distribution."
            else:
                fallback = "Missing required columns for strategic analysis."
        else:
            fallback = f"To provide strategic recommendations, upload a dataset with both measure and dimension columns. Currently found: {len(measures)} measure(s) and {len(dims)} dimension(s)."
    elif "trend" in user_msg or "direction" in user_msg or "pattern" in user_msg or "forecast" in user_msg:
        if measures and dims:
            m_name = measures[0]["name"]
            time_dims = [d for d in dims if d["role"] == "Time Dimension"]
            if time_dims and m_name in df.columns:
                d_name = time_dims[0]["name"]
                if d_name in df.columns:
                    try:
                        temp = df.copy()
                        temp["_dt"] = pd.to_datetime(temp[d_name], errors="coerce")
                        temp = temp.dropna(subset=["_dt"]).sort_values("_dt")
                        if len(temp) > 1:
                            mid = len(temp) // 2
                            first_half = temp.iloc[:mid][m_name].mean()
                            second_half = temp.iloc[mid:][m_name].mean()
                            if first_half > 0:
                                change_pct = round((second_half - first_half) / abs(first_half) * 100, 1)
                                direction = "increasing" if change_pct > 0 else "decreasing"
                                fallback = f"Trend analysis for {name}:\n\n- {m_name} is {direction} by {abs(change_pct)}% over {d_name}.\n- Range: {df[m_name].min():,.0f} to {df[m_name].max():,.0f} across {len(temp)} time periods.\n- Consider using {d_name} for predictive forecasting."
                            else:
                                fallback = f"Trend analysis: {m_name} shows no significant directional change over {time_dims[0]['name']}."
                        else:
                            fallback = f"Insufficient time-series data to determine a trend for {m_name}."
                    except Exception:
                        fallback = f"Could not compute trend for {m_name}, but the overall range is {df[m_name].min():,.0f} to {df[m_name].max():,.0f}."
                else:
                    fallback = f"No time dimension column found for trend analysis. Available dimensions: {', '.join(d['name'] for d in dims)}."
            else:
                fallback = f"To analyze trends, upload a dataset with a time dimension column and at least one numeric measure. Found {len(measures)} measure(s) and {len(dims)} dimension(s)."
        else:
            fallback = "Trend analysis requires both numeric measures and a time dimension column."
    elif "top" in user_msg or "best" in user_msg or "highest" in user_msg or "leading" in user_msg or "perform" in user_msg or "ranking" in user_msg or "rank" in user_msg or "compare" in user_msg or "comparison" in user_msg:
        if measures and dims:
            m_name, d_name = measures[0]["name"], dims[0]["name"]
            if m_name in df.columns and d_name in df.columns:
                agg = df.groupby(d_name)[m_name].sum().sort_values(ascending=False)
                total = agg.sum()
                top3 = agg.head(3)
                lines = [f"Top performers in {name} by {m_name}:"]
                for cat, val in top3.items():
                    pct = round(val / total * 100, 1) if total > 0 else 0
                    lines.append(f"- {cat}: {val:,.0f} ({pct}% of total)")
                if len(agg) > 3:
                    lines.append(f"... and {len(agg) - 3} more categories")
                fallback = "\n".join(lines)
            else:
                fallback = f"Could not compute rankings. Check that '{m_name}' and '{d_name}' are valid columns."
        else:
            fallback = "Ranking analysis requires both measure and dimension columns."
    elif "correlat" in user_msg or "relationship" in user_msg or "link" in user_msg or "connection" in user_msg or "associat" in user_msg or "between" in user_msg or "how" in user_msg or "what is" in user_msg or "why" in user_msg or "explain" in user_msg:
        if len(measures) >= 2:
            m1, m2 = measures[0]["name"], measures[1]["name"]
            if m1 in df.columns and m2 in df.columns:
                corr = round(df[m1].corr(df[m2]), 3)
                strength = "strong" if abs(corr) > 0.7 else "moderate" if abs(corr) > 0.4 else "weak"
                fallback = f"Relationship analysis between {m1} and {m2} in {name}:\n\n- Correlation coefficient: {corr} ({strength} relationship)\n- This means changes in {m1} {'tend to'} move {'in the same direction as' if corr > 0 else 'in the opposite direction from'} {m2}.\n- Practical implication: {'Consider adjusting both metrics together' if abs(corr) > 0.4 else 'These metrics appear independent — consider them separately.'}"
            else:
                fallback = f"Could not compute correlation between {measures[0]['name']} and {measures[1]['name']}."
        else:
            fallback = f"Correlation analysis needs at least 2 numeric measures. Found {len(measures)}. Try asking about relationships between different metrics."
    else:
        m_lines = [f"Welcome! I've loaded {name} with {total_rows:,} records and {len(df.columns)} columns."]
        if measures:
            m_lines.append(f"Key measures: {', '.join(m['name'] for m in measures[:3])}.")
            for m in measures[:3]:
                m_lines.append(f"- {m['name']}: {fmt(m['name'])}")
        if dims:
            m_lines.append(f"Key dimensions: {', '.join(d['name'] for d in dims[:3])}.")
        m_lines.append("I'm running on fallback mode because the AI service is temporarily unavailable.")
        m_lines.append("You can still ask me about: strategies, trends, risks, KPIs, rankings, relationships, or general questions about your data.")
        fallback = "\n".join(m_lines)
    return {"response": fallback, "source": "rule_based", "ai_error": result["text"]}

@router.post("/explain-chart")
def explain_chart_endpoint(req: dict = Body(default={})):
    if db["data"] is None:
        raise HTTPException(status_code=400, detail="No data uploaded")
    chart_type = req.get("chart_type", "bar")
    api_key = req.get("api_key")
    model_name = req.get("model_name", "gemini-2.5-flash")
    summary = f"Stats: {db['stats']}"
    result = explain_chart(api_key, model_name, chart_type, summary)
    if result["success"]:
        return {"explanation": result["text"], "source": "gemini"}
    return {"explanation": f"Chart type: {chart_type}. Shows {chart_type} distribution of the dataset.", "source": "rule_based"}

@router.get("/config")
def get_config():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    model_name = os.environ.get("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    return {
        "api_key_set": bool(api_key),
        "api_key_preview": api_key[:10] + "..." if api_key else "",
        "model_name": model_name,
        "loaded_from_env": bool(api_key),
    }

@router.get("/columns")
def get_columns():
    if db["data"] is None:
        raise HTTPException(status_code=400, detail="No data uploaded")
    df = db["data"]
    cols = {
        "columns": df.columns.tolist(),
        "numeric_columns": db["numeric_columns"],
        "category_columns": db["categorical_columns"],
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
    }
    return cols

@router.post("/trend-column")
def get_ai_trend_column(req: dict = Body(...)):
    if db["data"] is None:
        raise HTTPException(status_code=400, detail="No data uploaded")
    api_key = req.get("api_key")
    model_name = req.get("model_name", "gemini-2.5-flash")
    df = db["data"]
    cols = detect_columns(df)
    numeric_cols = cols["numeric"]
    
    if not numeric_cols:
        raw_numeric = df.select_dtypes(include='number').columns.tolist()
        numeric_cols = [c for c in raw_numeric if c not in cols.get("identifiers", [])] or raw_numeric

    # Try Gemini recommendation with strict prompt
    trend_col = None
    x_axis = cols.get("best_datetime") or cols.get("best_category")
    
    try:
        from services.profiler import profile_dataset
        from services.ai_recommender import recommend_visualization
        profile = profile_dataset(df)
        recom = recommend_visualization(profile)
        if isinstance(recom, dict) and recom.get("y_axis") in numeric_cols:
            trend_col = recom["y_axis"]
            if recom.get("x_axis") and recom["x_axis"] in df.columns:
                x_axis = recom["x_axis"]
    except Exception:
        pass

    if not trend_col or trend_col not in numeric_cols:
        trend_col = numeric_cols[0] if numeric_cols else None

    return {
        "trend_column": trend_col,
        "x_axis": x_axis,
        "numeric_columns": numeric_cols,
        "category_column": cols.get("best_category"),
        "datetime_column": cols.get("best_datetime")
    }

@router.get("/trend")
def get_full_trend():
    if db["data"] is None:
        raise HTTPException(status_code=400, detail="No data uploaded")
    df = db["data"]
    cols = detect_columns(df)
    numeric_cols = cols["numeric"]
    group_col = cols.get("best_datetime") or cols.get("best_category")

    if not numeric_cols:
        raise HTTPException(status_code=400, detail="No numeric measure columns found")

    trend_col = numeric_cols[0]
    chart_type = "line" if cols.get("best_datetime") else "bar"
    chart_data = []
    chart_title = f"{trend_col} over {group_col}" if group_col else f"{trend_col} summary"

    if group_col:
        grouped = df.groupby(group_col)[trend_col].sum().reset_index()
        # sort if date-like or by value
        if cols.get("best_datetime") and group_col == cols.get("best_datetime"):
            try:
                grouped["_dt"] = pd.to_datetime(grouped[group_col], errors='coerce')
                grouped = grouped.sort_values("_dt").drop(columns=["_dt"])
            except Exception:
                pass
        chart_data = grouped.to_dict(orient="records")
    else:
        values = df[trend_col].tolist()
        chart_data = [{"index": i, "value": float(v) if not np.isnan(v) else 0} for i, v in enumerate(values)]

    stats = {
        "col": trend_col,
        "x_col": group_col,
        "sum": float(df[trend_col].sum()),
        "mean": float(df[trend_col].mean()),
        "min": float(df[trend_col].min()),
        "max": float(df[trend_col].max()),
        "count": int(df[trend_col].count()),
        "category_column": cols.get("best_category"),
        "datetime_column": cols.get("best_datetime"),
        "chart_type": chart_type,
        "chart_title": chart_title,
        "chart_data": chart_data[:100]
    }
    return stats
