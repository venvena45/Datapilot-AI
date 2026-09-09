from fastapi import APIRouter, HTTPException, Body
import pandas as pd
from routers.upload import db
from services.semantic_analyzer import semantic_profile_dataset
from services.ai_recommender import recommend_semantic_visualization, rule_based_recommendation
from services.validator import validate_semantic_recommendation, find_preferred_dimension, find_best_measure
from services.chart_engine import generate_chart_data, generate_donut_data, generate_kpi_summary

router = APIRouter(prefix="/api/visualization")

@router.post("/full")
def get_semantic_visualization(req: dict = Body(default={})):
    if db["data"] is None:
        raise HTTPException(status_code=400, detail="No data uploaded")

    df = db["data"]
    profile = semantic_profile_dataset(df)
    ai_recommendation = recommend_semantic_visualization(profile)

    ai_failed = ai_recommendation.get("error") in ("quota_exceeded", "api_error", "no_api_key", "parse_error") or not ai_recommendation.get("valid")
    if ai_failed:
        recommendation = rule_based_recommendation(profile)
        fallback_source = f"Rule-based ({ai_recommendation.get('error', 'Gemini flagged invalid')})"
    else:
        recommendation = ai_recommendation
        fallback_source = None

    validation = validate_semantic_recommendation(recommendation, profile)
    validated = validation["validated_recommendation"]

    if not validation["is_valid"]:
        return {
            "status": "unsuitable",
            "profile": profile,
            "message": "Dataset does not have meaningful Dimension-Measure combinations for trend analysis.",
            "recommendation": validated,
            "chart": None,
            "donut": None,
        }

    chart_data = generate_chart_data(
        df,
        x_axis=validated["x_axis"],
        y_axis=validated["y_axis"],
        group_by=validated.get("group_by"),
        chart_type=validated.get("recommended_chart_type", "bar")
    )

    donut_dim = find_preferred_dimension(profile, prefer_time=False)
    donut_measure = validated["y_axis"]
    donut_data = None
    if donut_dim and donut_measure:
        donut_data = generate_donut_data(df, donut_dim, donut_measure)

    kpis = generate_kpi_summary(df, [c["name"] for c in profile["columns"] if c["role"] == "Measure"])

    return {
        "status": "success",
        "profile": profile,
        "recommendation": validated,
        "validation": validation,
        "explanation": validated.get("meaningful_relationship_reason", "Auto-selected based on semantic analysis."),
        "fallback_source": fallback_source,
        "chart": chart_data,
        "donut": donut_data,
        "kpis": kpis,
    }
