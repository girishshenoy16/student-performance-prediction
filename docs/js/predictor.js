let artifactsData = null;

async function loadArtifacts() {
  if (artifactsData) return artifactsData;
  try {
    const response = await fetch("./artifacts.json");
    if (!response.ok) throw new Error("Failed to load artifacts.json");
    artifactsData = await response.json();
    return artifactsData;
  } catch (err) {
    console.error("Error loading artifacts:", err);
    throw err;
  }
}

function getPerformanceCategory(score) {
  if (score < 60) return "At Risk";
  if (score < 75) return "Average";
  if (score < 85) return "Good";
  return "Excellent";
}

function preprocessInput(input, artifacts) {
  const featureColumns = artifacts.feature_columns;
  const categoricalMappings = artifacts.categorical_mappings;
  const scalerMeans = artifacts.scaler_means;
  const scalerStds = artifacts.scaler_stds;

  const numericCols = [
    "Hours_Studied", "Attendance", "Sleep_Hours",
    "Previous_Scores", "Tutoring_Sessions", "Physical_Activity"
  ];

  const categoricalCols = [
    "Parental_Involvement", "Access_to_Resources", "Extracurricular_Activities",
    "Motivation_Level", "Internet_Access", "Family_Income", "Teacher_Quality",
    "School_Type", "Peer_Influence", "Learning_Disabilities",
    "Parental_Education_Level", "Distance_from_Home", "Gender"
  ];

  const scaled = {};

  for (const col of numericCols) {
    const raw = parseFloat(input[col]) || 0;
    const mean = scalerMeans[col] || 0;
    const std = scalerStds[col] || 1;
    scaled[col] = (raw - mean) / std;
  }

  for (const col of categoricalCols) {
    const mapping = categoricalMappings[col] || {};
    let val = input[col];
    if (val === undefined || val === null || val === "") {
      const mode = artifacts.categorical_modes ? artifacts.categorical_modes[col] : null;
      val = mode !== undefined && mode !== null ? mode : null;
    }
    scaled[col] = (val !== null && val !== undefined && mapping[val] !== undefined) ? mapping[val] : -1;
  }

  scaled["Study_Efficiency_Index"] = (scaled["Hours_Studied"] * scaled["Previous_Scores"]) / 100.0;
  scaled["Engagement_Score"] = (scaled["Attendance"] * scaled["Hours_Studied"]) / 100.0;
  scaled["Study_Sleep_Ratio"] = scaled["Hours_Studied"] / (scaled["Sleep_Hours"] || 1);

  return featureColumns.map(col => scaled[col] !== undefined ? scaled[col] : 0);
}

function predictLinearRegression(featureVector, artifacts) {
  const coefficients = artifacts.coefficients;
  const intercept = artifacts.intercept;
  let score = intercept;
  for (let i = 0; i < coefficients.length; i++) {
    score += coefficients[i] * featureVector[i];
  }
  return score;
}

function predict(input) {
  if (!artifactsData) {
    throw new Error("Artifacts not loaded. Call loadArtifacts() first.");
  }

  const featureVector = preprocessInput(input, artifactsData);
  const score = predictLinearRegression(featureVector, artifactsData);
  const category = getPerformanceCategory(score);
  const topSignals = computeTopSignals(featureVector, artifactsData);

  return {
    score: Math.round(score * 10) / 10,
    category: category,
    topSignals: topSignals
  };
}

/**
 * Compute top predictive signals for the current profile.
 *
 * Methodology: For a linear regression model y = intercept + Σ(coeff_i × x_i),
 * the absolute contribution of feature i to this specific prediction is
 * |coeff_i × x_i|. This combines the model's learned weight with the user's
 * actual (scaled) input values, producing an input-aware signal ranking.
 *
 * @param {number[]} featureVector - Preprocessed (scaled) feature values.
 * @param {object} artifacts - Model artifacts containing coefficients, feature_names.
 * @returns {Array<{feature: string, contribution: number, direction: string}>}
 *   Top 6 signals sorted by descending absolute contribution.
 */
function computeTopSignals(featureVector, artifacts) {
  const coefficients = artifacts.coefficients;
  const featureNames = artifacts.feature_names;

  const contributions = featureNames.map((name, i) => {
    const raw = coefficients[i] * featureVector[i];
    return {
      feature: name.replace(/_/g, " "),
      contribution: Math.abs(Math.round(raw * 1000) / 1000),
      direction: raw >= 0 ? "positive" : "negative"
    };
  });

  contributions.sort((a, b) => b.contribution - a.contribution);
  return contributions.slice(0, 6);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadArtifacts,
    getPerformanceCategory,
    preprocessInput,
    predictLinearRegression,
    predict,
    computeTopSignals
  };
}
