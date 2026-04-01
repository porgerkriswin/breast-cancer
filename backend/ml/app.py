"""
BreastGuard AI — FastAPI ML Service
Serves the CNN mammogram classifier as a REST API.
"""

import io
import numpy as np
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
from tensorflow import keras
from PIL import Image

app = FastAPI(
    title="BreastGuard AI — ML Service",
    description="CNN mammogram classification API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

IMG_SIZE = (224, 224)
MODEL_PATH = Path("models/breastguard_cnn.h5")
model = None


@app.on_event("startup")
def load_model():
    global model
    if MODEL_PATH.exists():
        model = keras.models.load_model(str(MODEL_PATH))
        print(f"Model loaded from {MODEL_PATH}")
    else:
        print("WARNING: No trained model found. Run train.py first.")


class PredictionResponse(BaseModel):
    classification: str
    probability_malignant: float
    confidence: float
    disclaimer: str


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/classify", response_model=PredictionResponse)
async def classify_mammogram(file: UploadFile = File(...)):
    """
    Classify an uploaded mammogram image as Benign or Malignant.
    Accepts: JPEG, PNG
    Returns: classification + probability score
    """
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded. Train the model first.")

    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are accepted.")

    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB").resize(IMG_SIZE)
        arr = np.array(img, dtype=np.float32) / 255.0
        arr = np.expand_dims(arr, axis=0)

        prob = float(model.predict(arr, verbose=0)[0][0])
        label = "Malignant" if prob >= 0.5 else "Benign"
        confidence = round(prob if label == "Malignant" else 1 - prob, 4)

        return PredictionResponse(
            classification=label,
            probability_malignant=round(prob, 4),
            confidence=confidence,
            disclaimer="Research prototype only. Not for clinical diagnosis. Always consult a radiologist.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
