import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api.routes import router as api_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("soc-ai-service")

app = FastAPI(
    title="SOC Assistant AI/ML Service",
    version="1.0.0",
    description="Machine Learning Anomaly Detection & AI Threat Analysis Service for Wazuh SOC Events"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "UP",
        "service": "AI/ML Threat Analysis Microservice",
        "model": "Scikit-Learn IsolationForest + LLM Engine",
        "llm_enabled": bool(os.getenv("OPENAI_API_KEY", "").strip())
    }

app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
