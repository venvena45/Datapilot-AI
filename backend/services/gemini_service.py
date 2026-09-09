import google.generativeai as genai
import os
import time
import json
import re
from dotenv import load_dotenv

load_dotenv()

_api_key = os.environ.get("GEMINI_API_KEY", "")
_model_name = os.environ.get("GEMINI_MODEL_NAME", "gemini-2.5-flash")

def _clean_text(text: str) -> str:
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    text = re.sub(r'^- ', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\d+\. ', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def _get_key(api_key: str = None) -> str:
    return api_key or _api_key or os.getenv("GEMINI_API_KEY", "")

def _get_model(model_name: str = None) -> str:
    return model_name or _model_name or os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")

def _call_gemini(api_key: str, model_name: str, prompt: str, max_retries: int = 3) -> dict:
    key = _get_key(api_key)
    model = _get_model(model_name)
    if not key:
        return {"success": False, "error_type": "no_api_key", "text": "No Gemini API key found. Set GEMINI_API_KEY in .env file."}
    genai.configure(api_key=key)
    m = genai.GenerativeModel(model)
    for attempt in range(max_retries):
        try:
            response = m.generate_content(prompt)
            return {"success": True, "text": _clean_text(response.text)}
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
                if attempt < max_retries - 1:
                    wait = min(2 ** attempt * 5, 60)
                    time.sleep(wait)
                    continue
                return {"success": False, "error_type": "quota_exceeded", "text": _clean_text(f"Gemini API quota exceeded. Free tier limit: 20 requests/day. Retry in ~{2 ** attempt * 5}s or upgrade plan at https://ai.google.dev/gemini-api/docs/rate-limits")}
            return {"success": False, "error_type": "api_error", "text": _clean_text(f"Gemini API error: {error_msg[:300]}")}
    return {"success": False, "error_type": "max_retries", "text": _clean_text("Max retries exceeded.")}

def generate_insight(api_key=None, model_name=None, data_context="") -> dict:
    prompt = f"""You are an expert Business Intelligence Analyst and Data Analyst.

Your task is to generate a Business Intelligence report completely based on the uploaded dataset.

IMPORTANT RULES
- Never use generic recommendations.
- Never generate recommendations not supported by data.
- Every insight must reference actual columns, statistics, relationships, trends, or anomalies.
- If not enough evidence exists, explicitly state that instead of inventing conclusions.
- Do not produce template reports.
- Do NOT use any markdown formatting. No headers (#, ##), no bold (**), no asterisks (*), no bullet points (-), no numbered lists (1., 2.).
- Use plain text only. Use line breaks and indentation to organize content. Use dash (-) only for list items without any special formatting.

You will receive:
{data_context}

Generate a report with these sections in plain text (no markdown):

1. Executive Summary
What this dataset represents based on actual columns.

2. Key Findings
Mention ONLY findings supported by data.
Examples: Highest selling category, Region with highest revenue, Products with lowest sales, Customer segment with highest purchase frequency, Seasonal trend, Significant correlation, Anomalies.

3. Business Insights
Explain what these findings mean for the business.

4. Strategic Recommendations
Each recommendation MUST reference specific columns, explain why, explain expected impact.

BAD: Focus on high-performing regions.
GOOD: Region 'West' contributes 42% of total sales while 'South' contributes only 11%. Consider reallocating marketing budget toward South to increase market penetration.

5. Risks
Identify risks only if supported by data.

6. Opportunities
Identify growth opportunities based on dataset.

7. Suggested KPIs
Recommend KPIs monitorable using available columns.

Adapt to dataset domain automatically (Sales to revenue/products/regions/customers; HR to employees/departments/performance/retention; Healthcare to patients/diseases/treatments; Finance to profit/expenses/transactions; Retail to products/categories/sales/customers etc.)
Do not mention columns that do not exist.
Output in clean plain text, no markdown formatting at all."""
    result = _call_gemini(api_key, model_name, prompt)
    if result["success"]:
        return {"success": True, "text": result["text"], "source": "gemini"}
    return {"success": False, "error_type": result["error_type"], "text": result["text"], "source": "gemini"}

def chat_with_gemini(api_key=None, model_name=None, messages=[], data_context="") -> dict:
    user_msg = messages[-1].get("content", "") if messages else ""
    prompt = f"""You are a senior Business Intelligence Consultant.
Data Context: {data_context}
User Question: {user_msg}

Answer in English with a professional tone, grounded in data. Give concrete and actionable recommendations.
Do NOT use any markdown formatting. No headers (#, ##), no bold (**), no asterisks (*), no bullet points (-), no numbered lists.
Use plain text only with natural paragraph breaks."""
    result = _call_gemini(api_key, model_name, prompt)
    if result["success"]:
        return {"success": True, "text": result["text"], "source": "gemini"}
    return {"success": False, "error_type": result["error_type"], "text": result["text"], "source": "gemini"}

def explain_chart(api_key=None, model_name=None, chart_type="", data_summary="") -> dict:
    prompt = f"Explain this {chart_type} chart in detail: {data_summary}\nDo NOT use markdown. Use plain text only, no headers, no bold, no bullets."
    result = _call_gemini(api_key, model_name, prompt)
    if result["success"]:
        return {"success": True, "text": result["text"], "source": "gemini"}
    return {"success": False, "error_type": result["error_type"], "text": _clean_text(result["text"]), "source": "gemini"}

def rule_based_insight(profile: dict, stats: dict, df=None) -> str:
    NON_BUSINESS = {"age", "id", "index", "row number", "row_number"}
    
    measures = [c for c in profile.get("columns", []) if c["role"] == "Measure" and c["name"].lower() not in NON_BUSINESS]
    if not measures:
        measures = [c for c in profile.get("columns", []) if c["role"] == "Measure"]
    dims = [c for c in profile.get("columns", []) if c["role"] in ("Dimension", "Geographic")]
    bools = [c for c in profile.get("columns", []) if c["role"] == "Boolean"]
    time_dims = [c for c in profile.get("columns", []) if c["role"] == "Time Dimension"]
    ids = [c for c in profile.get("columns", []) if c["role"] == "Identifier"]
    
    total_rows = profile.get('row_count', 0)
    total_missing = profile.get('total_missing', 0)
    
    import pandas as pd
    import numpy as np
    
    lines = [
        f"# Business Intelligence Report",
        f"*Generated from dataset with {total_rows} rows, {len(profile.get('columns', []))} columns*",
        "",
        "## 1. Executive Summary",
    ]
    
    exec_parts = [f"This dataset contains **{total_rows:,}** records across **{len(profile.get('columns', []))}** columns."]
    if measures:
        exec_parts.append(f"Primary measures: **{', '.join(m['name'] for m in measures[:3])}**.")
    if dims:
        exec_parts.append(f"Key dimensions: **{', '.join(d['name'] for d in dims[:3])}**.")
    if bools:
        exec_parts.append(f"Segments: **{', '.join(b['name'] for b in bools[:2])}**.")
    if time_dims:
        exec_parts.append(f"Time series: **{time_dims[0]['name']}**.")
    if ids:
        exec_parts.append(f"{len(ids)} identifier columns excluded.")
    lines.append(" ".join(exec_parts))
    
    lines.extend(["", "## 2. Key Findings"])
    
    for m in measures[:3]:
        col_stats = stats.get(m["name"], {})
        mean_val = col_stats.get("mean", 0)
        max_val = col_stats.get("max", 0)
        min_val = col_stats.get("min", 0)
        lines.append(f"- **{m['name']}**: Mean={mean_val:,.1f}, Min={min_val:,.1f}, Max={max_val:,.1f}")
    
    if df is not None:
        for d in dims[:3]:
            if d["name"] in df.columns:
                vc = df[d["name"]].value_counts()
                top_val = vc.index[0]
                top_pct = round(vc.iloc[0] / len(df) * 100, 1)
                bot_val = vc.index[-1]
                bot_pct = round(vc.iloc[-1] / len(df) * 100, 1)
                lines.append(f"- **{d['name']}**: Top='{top_val}' ({top_pct}%), Bottom='{bot_val}' ({bot_pct}%)")
        
        if measures and dims:
            m_name = measures[0]["name"]
            d_name = dims[0]["name"]
            if m_name in df.columns and d_name in df.columns:
                agg = df.groupby(d_name)[m_name].sum().sort_values(ascending=False)
                total = agg.sum()
                if total > 0:
                    top_cat = agg.index[0]
                    top_val = agg.iloc[0]
                    top_pct = round(top_val / total * 100, 1)
                    bottom_cat = agg.index[-1]
                    bottom_val = agg.iloc[-1]
                    bottom_pct = round(bottom_val / total * 100, 1)
                    lines.append(f"- **{m_name} by {d_name}**: '{top_cat}' contributes {top_pct}% ({top_val:,.0f}), while '{bottom_cat}' contributes {bottom_pct}% ({bottom_val:,.0f})")
        
        if len(measures) > 1:
            m1, m2 = measures[0]["name"], measures[1]["name"]
            if m1 in df.columns and m2 in df.columns:
                corr = round(df[m1].corr(df[m2]), 3)
                strength = "strong" if abs(corr) > 0.7 else "moderate" if abs(corr) > 0.4 else "weak"
                lines.append(f"- **{m1} vs {m2}**: Correlation = {corr} ({strength})")
        
        if bools and measures:
            b_name = bools[0]["name"]
            m_name = measures[0]["name"]
            if b_name in df.columns and m_name in df.columns:
                for val in df[b_name].unique():
                    subset = df[df[b_name] == val]
                    avg = round(subset[m_name].mean(), 1)
                    cnt = len(subset)
                    lines.append(f"- **{b_name}={val}**: {m_name} avg = {avg:,.1f} (n={cnt:,})")
        
        if time_dims and measures:
            t_name = time_dims[0]["name"]
            m_name = measures[0]["name"]
            if t_name in df.columns and m_name in df.columns:
                try:
                    temp = df.copy()
                    temp["_dt"] = pd.to_datetime(temp[t_name], errors="coerce")
                    temp = temp.dropna(subset=["_dt"]).sort_values("_dt")
                    if len(temp) > 1:
                        first_half = temp.iloc[:len(temp)//2][m_name].mean()
                        second_half = temp.iloc[len(temp)//2:][m_name].mean()
                        if first_half > 0:
                            change_pct = round((second_half - first_half) / abs(first_half) * 100, 1)
                            trend = "increasing" if change_pct > 0 else "decreasing"
                            lines.append(f"- **{m_name} trend**: {trend} by {abs(change_pct)}% over time ({t_name})")
                except Exception:
                    pass
    
    lines.extend(["", "## 3. Business Insights"])
    
    if df is not None and measures and dims:
        m_name = measures[0]["name"]
        d_name = dims[0]["name"]
        if m_name in df.columns and d_name in df.columns:
            agg = df.groupby(d_name)[m_name].sum().sort_values(ascending=False)
            total = agg.sum()
            if total > 0:
                top = agg.index[0]
                top_pct = round(agg.iloc[0] / total * 100, 1)
                bottom = agg.index[-1]
                bottom_pct = round(agg.iloc[-1] / total * 100, 1)
                gap = round(top_pct - bottom_pct, 1)
                lines.append(f"- '{top}' is the dominant {d_name} with {top_pct}% of total {m_name}, while '{bottom}' holds only {bottom_pct}%. Gap of {gap}pp indicates significant concentration.")
    
    if df is not None and bools and measures:
        b_name = bools[0]["name"]
        m_name = measures[0]["name"]
        if b_name in df.columns and m_name in df.columns:
            grouped = df.groupby(b_name)[m_name].mean()
            if len(grouped) == 2:
                vals = grouped.values
                ratio = round(max(vals) / max(min(vals), 1), 2)
                lines.append(f"- Average {m_name} differs {ratio}x between {b_name} groups.")
    
    if time_dims:
        lines.append(f"- Time dimension ({time_dims[0]['name']}) available for seasonal/trend analysis.")
    
    lines.extend(["", "## 4. Strategic Recommendations"])
    
    if df is not None and measures and dims:
        m_name = measures[0]["name"]
        d_name = dims[0]["name"]
        if m_name in df.columns and d_name in df.columns:
            agg = df.groupby(d_name)[m_name].sum().sort_values(ascending=False)
            total = agg.sum()
            if total > 0:
                bottom = agg.index[-1]
                bottom_pct = round(agg.iloc[-1] / total * 100, 1)
                lines.append(f"- **Increase {bottom} contribution**: '{bottom}' currently contributes only {bottom_pct}% of total {m_name}. Invest in targeted campaigns for this segment to improve market share.")
                
                top = agg.index[0]
                top_pct = round(agg.iloc[0] / total * 100, 1)
                if top_pct > 50:
                    lines.append(f"- **Reduce dependency on {top}**: {top} accounts for {top_pct}% of total {m_name}. Diversify to reduce concentration risk.")
    
    if time_dims and measures:
        lines.append(f"- **Time-series forecasting**: Use {time_dims[0]['name']} to predict seasonal patterns in {measures[0]['name']}.")
    
    if len(measures) > 1:
        lines.append(f"- **Optimize {measures[0]['name']} vs {measures[1]['name']}**: Investigate the relationship between these metrics to identify cost/revenue optimization opportunities.")
    
    lines.extend(["", "## 5. Risks"])
    
    if total_rows < 30:
        lines.append("- Small dataset size may not produce statistically significant conclusions.")
    if total_missing > 0:
        lines.append(f"- {total_missing} missing values detected, which may bias analysis.")
    if df is not None and measures:
        m_name = measures[0]["name"]
        if m_name in df.columns:
            q1 = df[m_name].quantile(0.25)
            q3 = df[m_name].quantile(0.75)
            iqr = q3 - q1
            outliers = len(df[(df[m_name] < q1 - 1.5*iqr) | (df[m_name] > q3 + 1.5*iqr)])
            if outliers > 0:
                lines.append(f"- {outliers} outliers detected in {m_name} ({round(outliers/len(df)*100, 1)}% of data) may distort averages.")
    if not lines[-1].startswith("-"):
        lines.append("- No significant data quality risks detected.")
    
    lines.extend(["", "## 6. Opportunities"])
    
    if df is not None and dims and measures:
        d_name = dims[0]["name"]
        m_name = measures[0]["name"]
        if d_name in df.columns and m_name in df.columns:
            agg = df.groupby(d_name)[m_name].sum().sort_values(ascending=False)
            total = agg.sum()
            if total > 0:
                underperformers = agg[agg / total < 0.2]
                for cat, val in underperformers.items():
                    lines.append(f"- **Grow '{cat}'**: Currently at {round(val/total*100, 1)}% — significant room to increase {m_name} contribution.")
    
    if time_dims:
        lines.append(f"- Use {time_dims[0]['name']} data for predictive demand planning.")
    
    lines.extend(["", "## 7. Suggested KPIs"])
    
    if measures:
        for m in measures[:3]:
            lines.append(f"- **{m['name']} Growth Rate** (vs previous period)")
            if dims:
                lines.append(f"- **{m['name']} Concentration** (share of top {dims[0]['name']})")
    
    return "\n".join(lines)
