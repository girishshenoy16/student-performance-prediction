import pytest
import subprocess
import json
import os
import sys
import tempfile
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.data_validation import RAW_DATA_PATH
from src.preprocessing import fit_preprocessing
from src.feature_engineering import add_engineered_features
from src.train_model import train_models

ARTIFACTS_PATH = os.path.join("docs", "artifacts.json")
NUM_SAMPLES = 60
TOLERANCE = 0.01

NODE_SCRIPT = r"""
const fs = require('fs');
const artifacts = JSON.parse(fs.readFileSync('docs/artifacts.json', 'utf-8'));
const samples = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));

function preprocessInput(input, artifacts) {
    const featureColumns = artifacts.feature_columns;
    const categoricalMappings = artifacts.categorical_mappings;
    const scalerMeans = artifacts.scaler_means;
    const scalerStds = artifacts.scaler_stds;
    const numericCols = ["Hours_Studied","Attendance","Sleep_Hours","Previous_Scores","Tutoring_Sessions","Physical_Activity"];
    const categoricalCols = ["Parental_Involvement","Access_to_Resources","Extracurricular_Activities","Motivation_Level","Internet_Access","Family_Income","Teacher_Quality","School_Type","Peer_Influence","Learning_Disabilities","Parental_Education_Level","Distance_from_Home","Gender"];
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
            val = (mode !== undefined && mode !== null) ? mode : null;
        }
        scaled[col] = (val !== null && val !== undefined && mapping[val] !== undefined) ? mapping[val] : -1;
    }
    scaled["Study_Efficiency_Index"] = (scaled["Hours_Studied"] * scaled["Previous_Scores"]) / 100.0;
    scaled["Engagement_Score"] = (scaled["Attendance"] * scaled["Hours_Studied"]) / 100.0;
    scaled["Study_Sleep_Ratio"] = scaled["Hours_Studied"] / (scaled["Sleep_Hours"] || 1);
    return featureColumns.map(col => scaled[col] !== undefined ? scaled[col] : 0);
}

function predict(featureVector, artifacts) {
    let score = artifacts.intercept;
    for (let i = 0; i < artifacts.coefficients.length; i++) {
        score += artifacts.coefficients[i] * featureVector[i];
    }
    return score;
}

const results = samples.map(input => predict(preprocessInput(input, artifacts), artifacts));
console.log(JSON.stringify(results));
"""


@pytest.fixture(scope="module")
def pipeline_data():
    df = pd.read_csv(RAW_DATA_PATH)
    processed_df, metadata = fit_preprocessing(df)
    processed_df = add_engineered_features(processed_df)
    training_results = train_models(processed_df)
    lr_model = training_results["models"]["linear_regression"]
    return {
        "raw_df": df,
        "processed_df": processed_df,
        "metadata": metadata,
        "feature_names": training_results["feature_names"],
        "lr_model": lr_model,
    }


@pytest.fixture(scope="module")
def artifacts():
    with open(ARTIFACTS_PATH, "r") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def sample_inputs_and_predictions(pipeline_data):
    raw_df = pipeline_data["raw_df"]
    processed_df = pipeline_data["processed_df"]
    feature_names = pipeline_data["feature_names"]
    lr_model = pipeline_data["lr_model"]

    sample_indices = list(range(0, min(NUM_SAMPLES, len(raw_df))))
    raw_samples = []
    py_predictions = []

    for idx in sample_indices:
        row = raw_df.iloc[idx]
        input_dict = {}
        for col in raw_df.columns:
            if col != "Exam_Score":
                val = row[col]
                if pd.isna(val):
                    input_dict[col] = None
                else:
                    input_dict[col] = val
        raw_samples.append(input_dict)

        feature_vec = processed_df.iloc[idx][feature_names].values.reshape(1, -1)
        pred = float(lr_model.predict(feature_vec)[0])
        py_predictions.append(pred)

    return raw_samples, py_predictions


@pytest.fixture(scope="module")
def js_predictions(sample_inputs_and_predictions):
    raw_samples, _ = sample_inputs_and_predictions

    samples_file = None
    script_file = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, dir="."
        ) as f:
            json.dump(raw_samples, f, default=lambda o: int(o) if isinstance(o, np.integer) else float(o) if isinstance(o, np.floating) else o)
            samples_file = f.name

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".js", delete=False, dir="."
        ) as f:
            f.write(NODE_SCRIPT)
            script_file = f.name

        result = subprocess.run(
            ["node", script_file, samples_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode != 0:
            pytest.fail(f"Node.js execution failed: {result.stderr}")
        return json.loads(result.stdout.strip())
    finally:
        if samples_file and os.path.exists(samples_file):
            os.remove(samples_file)
        if script_file and os.path.exists(script_file):
            os.remove(script_file)


def test_predictions_match(sample_inputs_and_predictions, js_predictions):
    _, py_preds = sample_inputs_and_predictions
    js_preds = js_predictions

    assert len(py_preds) == len(js_preds), (
        f"Count mismatch: Python={len(py_preds)}, JS={len(js_preds)}"
    )

    failures = []
    for i, (py_pred, js_pred) in enumerate(zip(py_preds, js_preds)):
        diff = abs(py_pred - js_pred)
        if diff > TOLERANCE:
            failures.append(f"  Sample {i}: Py={py_pred:.6f}, JS={js_pred:.6f}, diff={diff:.6f}")

    if failures:
        msg = f"Divergent predictions (tolerance={TOLERANCE}):\n" + "\n".join(failures[:10])
        pytest.fail(msg)


def test_minimum_sample_count(sample_inputs_and_predictions):
    raw_samples, _ = sample_inputs_and_predictions
    assert len(raw_samples) >= 50, f"Need >=50 samples, got {len(raw_samples)}"


def test_artifacts_valid():
    assert os.path.exists(ARTIFACTS_PATH)
    with open(ARTIFACTS_PATH, "r") as f:
        data = json.load(f)
    assert data["model_type"] == "linear_regression"
    assert len(data["coefficients"]) == len(data["feature_names"])
    assert len(data["scaler_means"]) > 0
    assert len(data["categorical_mappings"]) > 0
