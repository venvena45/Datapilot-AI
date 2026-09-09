import pandas as pd
from typing import Any

VALID_ROLES = ["Identifier", "Measure", "Dimension", "Time Dimension", "Geographic", "Boolean", "Text Description"]

def validate_semantic_recommendation(recommendation: dict, profile: dict) -> dict:
    issues = []
    validated = dict(recommendation or {})
    col_roles = {c["name"]: c["role"] for c in profile["columns"]}

    if not validated.get("valid", True):
        return {
            "is_valid": False,
            "validated_recommendation": validated,
            "issues": ["Gemini explicitly flagged recommendation as invalid."],
            "fallback_used": True,
        }

    x_col = validated.get("x_axis")
    y_col = validated.get("y_axis")

    if x_col not in col_roles:
        issues.append(f"x_axis '{x_col}' not found")
        validated["x_axis"] = None

    if y_col not in col_roles:
        issues.append(f"y_axis '{y_col}' not found")
        validated["y_axis"] = None

    if x_col in col_roles and col_roles[x_col] == "Identifier":
        issues.append(f"x_axis '{x_col}' rejected: Identifiers cannot be chart axes")
        validated["x_axis"] = find_preferred_dimension(profile, prefer_time=True)

    if y_col in col_roles and col_roles[y_col] != "Measure":
        issues.append(f"y_axis '{y_col}' rejected: Must be Measure, got {col_roles[y_col]}")
        validated["y_axis"] = find_best_measure(profile)

    group_by = validated.get("group_by")
    if group_by and group_by in col_roles and col_roles[group_by] == "Identifier":
        issues.append(f"group_by '{group_by}' rejected: Identifier")
        validated["group_by"] = None

    if validated.get("confidence_score", 0) < 0.3:
        validated["confidence_score"] = 0.5 if validated.get("x_axis") and validated.get("y_axis") else 0.1

    is_valid_chart = bool(validated.get("x_axis")) and bool(validated.get("y_axis"))
    return {
        "is_valid": is_valid_chart,
        "validated_recommendation": validated,
        "issues": issues,
        "fallback_used": len(issues) > 0,
    }

def find_preferred_dimension(profile: dict, prefer_time: bool = True) -> str:
    if prefer_time:
        for c in profile["columns"]:
            if c["role"] == "Time Dimension":
                return c["name"]
    for c in profile["columns"]:
        if c["role"] in ("Dimension", "Geographic", "Boolean") and 2 <= c["n_unique"] <= 30:
            return c["name"]
    return None

def find_best_measure(profile: dict) -> str:
    measures = [c for c in profile["columns"] if c["role"] == "Measure"]
    if not measures:
        return None
    measures.sort(key=lambda c: abs((c.get("mean") or 0) - (c.get("min") or 0)), reverse=True)
    return measures[0]["name"]
