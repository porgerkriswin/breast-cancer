# BreastGuard AI — Early Detection & Risk Assessment Platform

> An AI-powered breast cancer early detection system that combines clinical risk scoring, symptom analysis, and a medical consultation chatbot to help women take proactive control of their health.

---

## Overview

BreastGuard AI is a full-stack health-tech web application built for the **Applied AI Hackathon**. It addresses one of the most critical gaps in preventive healthcare: the lack of accessible, personalised breast cancer risk information and screening guidance — especially in regions with limited access to specialists.

The platform uses a **Gail Model-inspired multi-factor risk engine**, a **Claude-powered AI consultation chatbot**, and a **CNN-based mammogram image classifier** to deliver a comprehensive early detection experience — all in one interface.

**Why it matters:**
* Breast cancer is the most common cancer in women globally — 2.3 million new cases per year
* Early detection (Stage I) gives a 99% 5-year survival rate vs 29% at Stage IV
* Most women lack access to personalised risk assessments between annual checkups

---

## 🔗 Repository

**GitHub:** https://github.com/porgerkriswin/breast-cancer

---

## Tech Stack & Tools

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Tailwind CSS, Chart.js |
| Backend | Node.js, Express.js |
| AI / LLM | Anthropic Claude API (claude-sonnet-4-20250514) |
| ML Model | Python, TensorFlow / Keras (CNN for mammogram classification) |
| Database | MongoDB Atlas (patient session data) |
| Auth | JWT-based authentication |
| Deployment | Docker (docker-compose) |
| Version Control | Git + GitHub |

---

## Features

### 1. Clinical Risk Engine
* Multi-factor risk scoring inspired by the validated **Gail Model**
* Inputs: age, BMI, menstrual/menopause history, HRT use, pregnancies, family history, lifestyle, medical history
* Outputs: composite risk score (0–100), risk tier (Low / Moderate / High / Very High), per-factor breakdown bars, and personalised recommendations

### 2. Symptom Checker
* 10-symptom interactive triage with urgency classification
* NLP-based urgency levels: Monitor → See doctor in 2–4 weeks → Act today
* Built-in 5-step breast self-exam guide

### 3. AI Consultation Chatbot (Dr. Aria)
* Powered by **Anthropic Claude API**
* Answers questions about risk factors, symptoms, screening schedules, BRCA mutations, prevention
* Clinical system prompt with safety guardrails — never diagnoses, always recommends professional consultation

### 4. Personalised Screening Planner
* Generates a custom timeline based on age + risk level
* Covers: mammogram, MRI, clinical exam, genetic testing, chemoprevention
* Follows ACS (American Cancer Society) and WHO screening guidelines

### 5. Mammogram Image Classifier *(ML Extension)*
* CNN model architecture using TensorFlow/Keras
* Trained on CBIS-DDSM dataset
* Binary classification: Benign vs Malignant
* REST API endpoint for image upload + classification

### 6. Research Dashboard
* Survival rates by detection stage (animated charts)
* Evidence-based risk reduction strategies
* Modifiable vs non-modifiable risk factor breakdown

---

## Installation & Setup

### Prerequisites
* Node.js v18+
* Python 3.10+
* MongoDB Atlas account (free tier works)
* Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

### 1. Clone the repository
```bash
git clone https://github.com/porgerkriswin/breast-cancer.git
cd breast-cancer
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example.env .env
```

Edit `.env`:
```
PORT=5000
ANTHROPIC_API_KEY=your_anthropic_api_key_here
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ML_SERVICE_URL=http://localhost:8000
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm start
```

App runs at `http://localhost:3000`

### 4. ML service setup (optional)
```bash
cd ../backend/ml
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Run all services together (Docker)
```bash
docker-compose up --build
```

---

## Project Structure

```
breast-cancer/
├── frontend/
│   ├── components/
│   │   ├── RiskEngine.jsx
│   │   ├── SymptomChecker.jsx
│   │   ├── ChatBot.jsx
│   │   ├── ScreeningPlan.jsx
│   │   ├── MammogramUpload.jsx
│   │   └── Dashboard.jsx
│   ├── pages/
│   │   └── App.jsx
│   └── utils/
│       └── riskCalculator.js
├── backend/
│   ├── routes/
│   │   └── chat.js
│   ├── services/
│   │   └── anthropicService.js
│   ├── ml/
│   │   ├── model.py
│   │   ├── app.py
│   │   └── requirements.txt
│   └── server.js
├── tests/
│   └── risk.test.js
├── docs/
│   └── API.md
├── docker-compose.yml
└── README.md
```

---

## Ethical Considerations

* This tool is a **decision-support aid**, not a diagnostic device
* All risk scores are clearly labelled as estimates
* The AI chatbot includes mandatory professional-referral language
* No patient data is stored permanently without explicit consent
* The CNN model's uncertainty is surfaced to the user (probability score, not a binary verdict)

---

## Team

| Name | Role |
| --- | --- |
| porger kriswin | Full-stack dev + AI integration |
| stefin nirmal | ML model + backend |
| akash raj | UI/UX + frontend |
| hrithik maries | Data & testing |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

* [Anthropic Claude API](https://www.anthropic.com) for powering Dr. Aria
* [CBIS-DDSM Dataset](https://wiki.cancerimagingarchive.net/display/Public/CBIS-DDSM) for mammogram training data
* [Gail Model](https://bcrisktool.cancer.gov/) — National Cancer Institute's breast cancer risk assessment tool
* American Cancer Society screening guidelines
