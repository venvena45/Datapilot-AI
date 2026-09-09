import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

_api_key = os.environ.get("GEMINI_API_KEY", "")
_model_name = os.environ.get("GEMINI_MODEL_NAME", "gemini-2.5-flash")

def recommend_semantic_visualization(profile: dict) -> dict:
    key = _api_key or os.getenv("GEMINI_API_KEY", "")
    if not key:
        return {"valid": False, "error": "no_api_key", "reason": "No Gemini API key found."}

    columns_summary = []
    for col in profile["columns"]:
        columns_summary.append(
            f"- Column: {col['name']} | Semantic Role: {col['role']} | Data Type: {col['dtype']} | Unique Values: {col['n_unique']} | Samples: {col['sample_values'][:3]}"
        )

    prompt = f"""You are an expert Data Analyst & BI Specialist. Analyze the semantic profile of this dataset and recommend the most MEANINGFUL visualization.

Dataset Profile ({profile['row_count']} rows):
{chr(10).join(columns_summary)}

STRICT RULES:
1. NEVER select an 'Identifier' column (IDs, UUIDs, keys, codes, order numbers, phone numbers, emails) as an X-axis or Y-axis.
2. For Trend Analysis:
   - Priority 1 for X-axis: 'Time Dimension' (date, year, month, timestamp).
   - Priority 2 for X-axis: Meaningful business 'Dimension' or 'Geographic' (Category, Region, Department, Status, Branch, Product).
   - Y-axis MUST be a quantitative 'Measure' (Sales, Revenue, Profit, Price, Count, Age, Salary). NEVER an Identifier.
3. For Distribution (Pie/Donut):
   - X-axis/Category MUST be a meaningful business 'Dimension' or 'Geographic' with 2-15 unique values.
   - NEVER use an Identifier or high-cardinality 'Text Description' for distribution.
4. If no meaningful chart can be created (e.g. dataset only has IDs and text descriptions), return "valid": false with a clear explanation.

Return ONLY a JSON object:
{{
  "valid": true,
  "recommended_chart_type": "line" | "bar" | "area" | "pie",
  "x_axis": "exact_column_name",
  "y_axis": "exact_column_name",
  "group_by": null or "exact_column_name",
  "confidence_score": 0.0 to 1.0,
  "meaningful_relationship_reason": "Clear explanation of why this specific relationship provides business value."
}}"""

    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel(_model_name)
        response = model.generate_content(prompt)
        text = response.text.strip()
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
        return {"valid": False, "error": "parse_error", "reason": "Could not parse AI response."}
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
            return {"valid": False, "error": "quota_exceeded", "reason": f"Gemini API quota exceeded: {error_msg[:200]}"}
        return {"valid": False, "error": "api_error", "reason": f"Gemini API error: {error_msg[:200]}"}

def rule_based_recommendation(profile: dict) -> dict:
    time_dim = None
    dimensions = []
    measures = []
    for col in profile["columns"]:
        role = col["role"]
        if role == "Time Dimension":
            time_dim = col
        elif role == "Measure":
            measures.append(col)
        elif role in ("Dimension", "Geographic", "Boolean"):
            dimensions.append(col)

    if not measures:
        return {"valid": False, "reason": "No Measure columns found for Y-axis."}

    if time_dim:
        x_axis = time_dim["name"]
        chart_type = "line"
        group_by = None
        for d in dimensions:
            if d["n_unique"] <= 6:
                group_by = d["name"]
                break
    elif dimensions:
        best_dim = None
        for d in dimensions:
            if 2 <= d["n_unique"] <= 15:
                best_dim = d
                break
        if not best_dim:
            best_dim = dimensions[0]
        x_axis = best_dim["name"]
        chart_type = "bar"
        group_by = None
    else:
        return {"valid": False, "reason": "No suitable X-axis column found."}

    best_measure = measures[0]
    for m in measures:
        name_lower = m["name"].lower()
        if any(kw in name_lower for kw in ["total", "sales", "revenue", "amount", "profit"]):
            best_measure = m
            break

    relationship = f"{best_measure['name']} by {x_axis}"
    if group_by:
        relationship += f" grouped by {group_by}"

    return {
        "valid": True,
        "recommended_chart_type": chart_type,
        "x_axis": x_axis,
        "y_axis": best_measure["name"],
        "group_by": group_by,
        "confidence_score": 0.75,
        "meaningful_relationship_reason": f"Rule-based recommendation: {relationship}. Selected based on semantic roles detected in the dataset.",
    }
