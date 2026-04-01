/**
 * BreastGuard AI — Risk Engine Tests
 * Run with: npm test
 */

const { calculateRiskScore, getRiskTier } = require("../frontend/utils/riskCalculator");

describe("Risk Calculator", () => {
  test("returns low risk for young, healthy, no history", () => {
    const result = calculateRiskScore({
      age: 25,
      bmi: 22,
      menarche: "age12to14",
      menopause: "pre",
      pregnancies: "twoBreastfed",
      hrt: "never",
      familyHistory: "none",
      lifestyle: ["exercise"],
      medicalHistory: [],
    });
    expect(result.score).toBeLessThan(25);
    expect(result.tier.label).toBe("Low risk");
  });

  test("returns very high risk for BRCA+ with multiple factors", () => {
    const result = calculateRiskScore({
      age: 55,
      bmi: 32,
      menarche: "before12",
      menopause: "postAfter55",
      pregnancies: "nulliparous",
      hrt: "moreThan5",
      familyHistory: "brca",
      lifestyle: ["smoker", "alcohol", "sedentary"],
      medicalHistory: ["atypicalHyperplasia", "chestRadiation"],
    });
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.tier.label).toBe("Very high risk");
  });

  test("score is always clamped between 0 and 100", () => {
    const extreme = calculateRiskScore({
      age: 80,
      bmi: 40,
      menarche: "before12",
      menopause: "postAfter55",
      pregnancies: "nulliparous",
      hrt: "moreThan5",
      familyHistory: "brca",
      lifestyle: ["smoker", "alcohol", "sedentary", "denseTissue"],
      medicalHistory: ["atypicalHyperplasia", "chestRadiation", "previousBreastCancer"],
    });
    expect(extreme.score).toBeGreaterThanOrEqual(0);
    expect(extreme.score).toBeLessThanOrEqual(100);
  });

  test("recommendations include urgent action for very high risk", () => {
    const result = calculateRiskScore({
      age: 60,
      bmi: 30,
      menarche: "before12",
      menopause: "postAfter55",
      pregnancies: "nulliparous",
      hrt: "moreThan5",
      familyHistory: "brca",
      lifestyle: [],
      medicalHistory: [],
    });
    const urgentReco = result.recommendations.find((r) => r.type === "urgent");
    expect(urgentReco).toBeDefined();
  });

  test("getRiskTier returns correct tier for each range", () => {
    expect(getRiskTier(10).label).toBe("Low risk");
    expect(getRiskTier(35).label).toBe("Moderate risk");
    expect(getRiskTier(60).label).toBe("High risk");
    expect(getRiskTier(80).label).toBe("Very high risk");
  });

  test("exercise reduces score", () => {
    const withExercise = calculateRiskScore({
      age: 45, bmi: 26, menarche: "age12to14", menopause: "pre",
      pregnancies: "oneChild", hrt: "never", familyHistory: "none",
      lifestyle: ["exercise"], medicalHistory: [],
    });
    const withoutExercise = calculateRiskScore({
      age: 45, bmi: 26, menarche: "age12to14", menopause: "pre",
      pregnancies: "oneChild", hrt: "never", familyHistory: "none",
      lifestyle: [], medicalHistory: [],
    });
    expect(withExercise.score).toBeLessThan(withoutExercise.score);
  });
});
