from fastapi import APIRouter, HTTPException
from app.schemas.alert_schemas import AlertInput, AnalysisOutput, SummarizeRequest, SummarizeOutput
from app.services.analysis_service import analysis_service

router = APIRouter()

@router.post("/analyze", response_model=AnalysisOutput)
async def analyze_alert(alert: AlertInput):
    try:
        result = analysis_service.analyze_alert(alert)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@router.post("/summarize", response_model=SummarizeOutput)
async def summarize_incident(request: SummarizeRequest):
    try:
        result = analysis_service.summarize_incident(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Incident summary failed: {str(e)}")
