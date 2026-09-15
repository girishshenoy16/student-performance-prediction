import pytest
import sys
import os
import json
import subprocess
import tempfile
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.data_validation import RAW_DATA_PATH


def test_raw_csv_loadable():
    df = pd.read_csv(RAW_DATA_PATH)
    assert len(df) > 0
    assert "Exam_Score" in df.columns


def test_processed_csv_exists():
    path = os.path.join("data", "processed", "processed_student_data.csv")
    assert os.path.exists(path), "processed_student_data.csv not found"
    df = pd.read_csv(path)
    assert len(df) > 0


def test_artifacts_json_valid():
    path = os.path.join("docs", "artifacts.json")
    assert os.path.exists(path), "artifacts.json not found"
    with open(path, "r") as f:
        data = json.load(f)
    assert "model_type" in data
    assert "intercept" in data
    assert "coefficients" in data
    assert "feature_columns" in data


def test_overview_data_json_valid():
    path = os.path.join("docs", "overview_data.json")
    assert os.path.exists(path), "overview_data.json not found"
    with open(path, "r") as f:
        data = json.load(f)
    assert "kpis" in data
    assert "model_benchmark" in data
    assert "feature_importance" in data
