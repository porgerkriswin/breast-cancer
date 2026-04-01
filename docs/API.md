# BreastGuard AI — API Reference

Base URL: `http://localhost:5000/api`

---

## POST `/chat`

Send a message to the Dr. Aria AI consultation chatbot (powered by Claude).

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "What are early signs of breast cancer?" }
  ],
  "stream": false
}
```

**Response:**
```json
{
  "reply": "Early signs of breast cancer can include..."
}
```

**Streaming** — set `stream: true` to receive Server-Sent Events:
```
data: {"chunk": "Early "}
data: {"chunk": "signs "}
...
data: [DONE]
```

---

## POST `/risk/calculate`

Calculate a breast cancer risk score server-side.

**Request body:**
```json
{
  "age": 45,
  "bmi": 28.5,
  "menarche": "before12",
  "menopause": "pre",
  "pregnancies": "oneChild",
  "hrt": "never",
  "familyHistory": "firstDegree",
  "lifestyle": ["smoker", "sedentary"],
  "medicalHistory": ["priorBiopsy"]
}
```

**Response:**
```json
{
  "score": 52,
  "tier": {
    "label": "High risk",
    "color": "#e24b4a",
    "urgency": 3
  },
  "factors": [
    { "label": "Age", "score": 12, "max": 25 },
    ...
  ],
  "recommendations": [
    { "type": "warning", "text": "Annual mammogram strongly recommended..." },
    ...
  ],
  "disclaimer": "Heuristic estimate only. Consult a clinician."
}
```

---

## POST `/mammogram/classify`

Upload a mammogram image for CNN-based classification.

**Request:** `multipart/form-data` with field `image` (JPEG or PNG)

**Response:**
```json
{
  "classification": "Benign",
  "probability_malignant": 0.2341,
  "confidence": 0.7659,
  "disclaimer": "Research prototype only. Not for clinical diagnosis."
}
```

---

## GET `/screening/plan`

Get a personalised screening plan.

**Query params:** `?age=42&risk=high`

**Response:**
```json
{
  "plan": [
    {
      "title": "Annual mammogram — starting immediately",
      "description": "Recommended annually given elevated risk profile.",
      "urgency": "high",
      "frequency": "Annual"
    },
    ...
  ]
}
```

---

## GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-01T12:00:00.000Z"
}
```
