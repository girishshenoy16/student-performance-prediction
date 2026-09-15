import pytest
import sys
import os
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.feature_engineering import add_engineered_features, get_engineered_feature_names, validate_no_target_leakage
from src.data_validation import RAW_DATA_PATH, TARGET_COLUMN


@pytest.fixture
def raw_df():
    return pd.read_csv(RAW_DATA_PATH)


def test_engineered_features_added(raw_df):
    df = add_engineered_features(raw_df)
    for feat in get_engineered_feature_names():
        assert feat in df.columns, f"Feature '{feat}' not added"


def test_no_target_leakage(raw_df):
    result = validate_no_target_leakage(raw_df)
    assert result is True


def test_study_efficiency_formula(raw_df):
    df = add_engineered_features(raw_df)
    expected = raw_df["Hours_Studied"] * raw_df["Previous_Scores"] / 100.0
    pd.testing.assert_series_equal(
        df["Study_Efficiency_Index"], expected, check_names=False
    )


def test_engagement_score_formula(raw_df):
    df = add_engineered_features(raw_df)
    expected = raw_df["Attendance"] * raw_df["Hours_Studied"] / 100.0
    pd.testing.assert_series_equal(
        df["Engagement_Score"], expected, check_names=False
    )


def test_row_count_preserved(raw_df):
    df = add_engineered_features(raw_df)
    assert len(df) == len(raw_df)


def test_original_columns_preserved(raw_df):
    original_cols = raw_df.columns.tolist()
    df = add_engineered_features(raw_df)
    for col in original_cols:
        assert col in df.columns
