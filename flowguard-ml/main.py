import os
import random
import io
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import logging

# Set up simple logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_triage")

load_dotenv()

app = FastAPI(title="FlowGuard ML Triage Service", version="1.0.0")

# Allow requests from the Node backend or frontend directly if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, lock this down to the backend's IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    image_url: str

class AnalyzeResponse(BaseModel):
    severity: str
    blockage_type: str
    confidence: float

# Dummy / Reference data for mock model
SEVERITIES = ["low", "medium", "high"]
BLOCKAGE_TYPES = ["debris", "plastic_waste", "structural_damage", "sediment", "unknown"]

def mock_analyze_image(image_bytes: bytes) -> dict:
    """
    Simulates ML model logic.
    In a real-world scenario, this would load the image into a tensor,
    pass it through a ResNet/MobileNet model, and return the predicted class.
    
    Here we return a simulated realistic output based on the image bytes size.
    """
    # A pseudo-random seed based on image size to return consistent results for the same image
    random.seed(len(image_bytes))
    
    severity = random.choice(SEVERITIES)
    # If it's a very large image, let's bias towards higher confidence and specific blockages
    confidence = round(random.uniform(0.65, 0.98), 2)
    
    blockage = random.choice(BLOCKAGE_TYPES)
    
    return {
        "severity": severity,
        "blockage_type": blockage,
        "confidence": confidence
    }

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyzeEndpoint(req: AnalyzeRequest):
    logger.info(f"Received analysis request for URL: {req.image_url}")
    
    # 1. Download the image safely with a timeout
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(req.image_url)
            resp.raise_for_status()
            image_bytes = resp.content
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error downloading image: {e}")
        raise HTTPException(status_code=400, detail="Failed to download image from the provided URL. Make sure it's public.")
    except Exception as e:
        logger.error(f"Error downloading image: {e}")
        raise HTTPException(status_code=400, detail="Could not reach the image URL.")
    
    # 2. Prevent insanely large files (limit to 10MB approx)
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image limit exceeded (Max 10MB).")

    # 3. Analyze the image
    result = mock_analyze_image(image_bytes)
    
    logger.info(f"Analysis complete: {result}")
    
    return AnalyzeResponse(**result)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "FlowGuard ML Triage"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
