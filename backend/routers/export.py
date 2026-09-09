from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from services.report_service import export_to_pdf, export_to_docx
from services.gemini_service import rule_based_insight, _clean_text
from services.semantic_analyzer import semantic_profile_dataset
from routers.upload import db

router = APIRouter(prefix="/api/export")

def _get_export_context():
    if db.get("data") is None:
        raise HTTPException(status_code=400, detail="No data uploaded")
    
    df = db["data"]
    filename = db.get("filename") or "dataset"
    rows_count = len(df)
    columns = db.get("columns") or df.columns.tolist()
    stats = db.get("stats") or {}
    numeric_cols = db.get("numeric_columns") or []
    cat_cols = db.get("categorical_columns") or []
    dt_col = db.get("datetime_column")

    # Get cached insight or generate rule-based insight
    insights = db.get("insight")
    if not insights:
        try:
            profile = semantic_profile_dataset(df)
            insights = _clean_text(rule_based_insight(profile, stats, df=df))
        except Exception:
            insights = "No specific insights generated."

    return {
        "filename": filename,
        "rows_count": rows_count,
        "columns": columns,
        "stats": stats,
        "insights": insights,
        "numeric_cols": numeric_cols,
        "cat_cols": cat_cols,
        "dt_col": dt_col
    }

@router.post("/pdf")
def export_pdf():
    ctx = _get_export_context()
    pdf_bytes = export_to_pdf(
        filename=ctx["filename"],
        rows_count=ctx["rows_count"],
        columns=ctx["columns"],
        stats=ctx["stats"],
        insights=ctx["insights"],
        numeric_cols=ctx["numeric_cols"],
        cat_cols=ctx["cat_cols"],
        dt_col=ctx["dt_col"]
    )
    clean_name = ctx["filename"].rsplit('.', 1)[0] if "." in ctx["filename"] else ctx["filename"]
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{clean_name}_report.pdf"'}
    )

@router.post("/docx")
def export_docx():
    ctx = _get_export_context()
    docx_bytes = export_to_docx(
        filename=ctx["filename"],
        rows_count=ctx["rows_count"],
        columns=ctx["columns"],
        stats=ctx["stats"],
        insights=ctx["insights"],
        numeric_cols=ctx["numeric_cols"],
        cat_cols=ctx["cat_cols"],
        dt_col=ctx["dt_col"]
    )
    clean_name = ctx["filename"].rsplit('.', 1)[0] if "." in ctx["filename"] else ctx["filename"]
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{clean_name}_report.docx"'}
    )

