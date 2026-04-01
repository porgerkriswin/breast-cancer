/**
 * BreastGuard AI — Risk Calculator
 * Gail Model-inspired multi-factor breast cancer risk scoring engine.
 * 
 * DISCLAIMER: For informational use only. Not a clinical diagnostic tool.
 */

export const RISK_FACTORS = {
  age: {
    label: "Age",
    scores: { "18-29": 2, "30-39": 5, "40-49": 12, "50-59": 18, "60-69": 22, "70+": 25 },
  },
  bmi: {
    label: "BMI",
    scores: { normal: 0, overweight: 4, obese: 8, severelyObese: 12 },
  },
  menarche: {
    label: "Age at first period",
    scores: { before12: 3, age12to14: 0, after14: -1 },
  },
  menopause: {
    label: "Menopause status",
    scores: { pre: 0, postBefore55: 2, postAfter55: 4 },
  },
  pregnancies: {
    label: "Pregnancies & breastfeeding",
    scores: { nulliparous: 3, oneChild: 0, twoPlus: -1, twoBreastfed: -3 },
  },
  hrt: {
    label: "Hormone replacement therapy",
    scores: { never: 0, lessThan5: 3, moreThan5: 7 },
  },
  familyHistory: {
    label: "Family history",
    scores: { none: 0, distantRelative: 8, firstDegree: 16, brca: 28 },
  },
  lifestyle: {
    label: "Lifestyle",
    scores: {
      smoker: 5,
      alcohol: 5,
      sedentary: 4,
      exercise: -7,
      denseTissue: 9,
      mediterraneanDiet: -5,
    },
  },
  medicalHistory: {
    label: "Medical history",
    scores: {
      priorBiopsy: 8,
      atypicalHyperplasia: 16,
      chestRadiation: 13,
      oralContraceptive: 3,
      previousBreastCancer: 20,
    },
  },
};

/**
 * Calculate composite risk score
 * @param {Object} inputs - Patient input values
 * @returns {Object} - { score, tier, factors, recommendations }
 */
export function calculateRiskScore(inputs) {
  let totalScore = 0;
  const factorBreakdown = [];

  // Age score
  const ageScore = getAgeScore(inputs.age);
  totalScore += ageScore;
  factorBreakdown.push({ label: "Age", score: ageScore, max: 25, color: "#e24b4a" });

  // BMI score
  const bmiScore = getBMIScore(inputs.bmi);
  totalScore += bmiScore;
  factorBreakdown.push({ label: "BMI / weight", score: bmiScore, max: 12, color: "#ba7517" });

  // Hormonal history
  const hormonalScore =
    (RISK_FACTORS.menarche.scores[inputs.menarche] || 0) +
    (RISK_FACTORS.menopause.scores[inputs.menopause] || 0) +
    (RISK_FACTORS.hrt.scores[inputs.hrt] || 0);
  totalScore += hormonalScore;
  factorBreakdown.push({ label: "Hormonal history", score: Math.max(0, hormonalScore), max: 14, color: "#185fa5" });

  // Pregnancy
  const pregScore = RISK_FACTORS.pregnancies.scores[inputs.pregnancies] || 0;
  totalScore += pregScore;

  // Family & genetics
  const familyScore = RISK_FACTORS.familyHistory.scores[inputs.familyHistory] || 0;
  totalScore += familyScore;
  factorBreakdown.push({ label: "Family & genetics", score: familyScore, max: 28, color: "#534ab7" });

  // Lifestyle (sum of selected factors)
  let lifestyleScore = 0;
  if (inputs.lifestyle && Array.isArray(inputs.lifestyle)) {
    inputs.lifestyle.forEach((factor) => {
      lifestyleScore += RISK_FACTORS.lifestyle.scores[factor] || 0;
    });
  }
  totalScore += lifestyleScore;
  factorBreakdown.push({ label: "Lifestyle", score: Math.max(0, lifestyleScore), max: 22, color: "#ba7517" });

  // Medical history (sum of selected)
  let medScore = 0;
  if (inputs.medicalHistory && Array.isArray(inputs.medicalHistory)) {
    inputs.medicalHistory.forEach((factor) => {
      medScore += RISK_FACTORS.medicalHistory.scores[factor] || 0;
    });
  }
  totalScore += medScore;
  factorBreakdown.push({ label: "Medical history", score: Math.max(0, medScore), max: 35, color: "#a32d2d" });

  const clampedScore = Math.max(0, Math.min(100, Math.round(totalScore)));
  const tier = getRiskTier(clampedScore);
  const recommendations = generateRecommendations(clampedScore, inputs);

  return {
    score: clampedScore,
    tier,
    factors: factorBreakdown,
    recommendations,
    disclaimer: "This score is a heuristic estimate. Consult a licensed clinician for diagnosis.",
  };
}

function getAgeScore(age) {
  if (!age) return 0;
  if (age >= 70) return 25;
  if (age >= 60) return 22;
  if (age >= 50) return 18;
  if (age >= 40) return 12;
  if (age >= 30) return 5;
  return 2;
}

function getBMIScore(bmi) {
  if (!bmi) return 0;
  if (bmi >= 35) return 12;
  if (bmi >= 30) return 8;
  if (bmi >= 25) return 4;
  return 0;
}

export function getRiskTier(score) {
  if (score < 25) return { label: "Low risk", color: "#639922", bgColor: "#eaf3de", textColor: "#27500a", urgency: 1 };
  if (score < 50) return { label: "Moderate risk", color: "#ba7517", bgColor: "#faeeda", textColor: "#633806", urgency: 2 };
  if (score < 75) return { label: "High risk", color: "#e24b4a", bgColor: "#fcebeb", textColor: "#791f1f", urgency: 3 };
  return { label: "Very high risk", color: "#a32d2d", bgColor: "#f09595", textColor: "#501313", urgency: 4 };
}

function generateRecommendations(score, inputs) {
  const recos = [];
  if (score >= 75) {
    recos.push({ type: "urgent", text: "Seek urgent referral to a breast oncology specialist immediately." });
    recos.push({ type: "urgent", text: "Annual MRI + mammogram programme should begin without delay." });
  } else if (score >= 50) {
    recos.push({ type: "warning", text: "Annual mammogram strongly recommended — discuss with your doctor." });
    recos.push({ type: "warning", text: "Consider genetic counselling if first-degree relatives had breast or ovarian cancer." });
  } else if (score >= 25) {
    recos.push({ type: "warning", text: "Clinical breast exam every 12 months is recommended." });
    recos.push({ type: "warning", text: "Begin annual mammograms at age 40 or earlier if symptoms arise." });
  }
  recos.push({ type: "ok", text: "Perform a thorough breast self-exam every month." });
  recos.push({ type: "ok", text: "Aim for 150+ minutes of moderate aerobic activity per week." });
  recos.push({ type: "ok", text: "Limit alcohol to fewer than 1 standard drink per day." });
  if (inputs.bmi >= 25) {
    recos.push({ type: "warning", text: "Gradual weight reduction meaningfully lowers post-menopausal risk." });
  }
  if (inputs.hrt === "moreThan5") {
    recos.push({ type: "warning", text: "Discuss risks and alternatives to long-term HRT with your gynaecologist." });
  }
  recos.push({ type: "ok", text: "Eat a diet rich in vegetables, fruits, and whole grains." });
  return recos;
}
