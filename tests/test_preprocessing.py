import pytest
import sys
import os
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.preprocessing import fit_preprocessing, transform_with_metadata
from src.data_validation import RAW_DATA_PATH


@pytest.fixture
def raw_df():
    return pd.read_csv(RAW_DATA_PATH)


def test_fit_preprocessing_preserves_rows(raw_df):
    processed_df, metadata = fit_preprocessing(raw_df)
    assert len(processed_df) == len(raw_df)


def test_fit_preprocessing_creates_metadata(raw_df):
    _, metadata = fit_preprocessing(raw_df)
    assert "feature_columns" in metadata
    assert "scaler_means" in metadata
    assert "scaler_stds" in metadata
    assert "categorical_mappings" in metadata


def test_target_excluded_from_features(raw_df):
    _, metadata = fit_preprocessing(raw_df)
    assert "Exam_Score" not in metadata["feature_columns"]


def test_transform_deterministic(raw_df):
    processed1, metadata = fit_preprocessing(raw_df)
    processed2 = transform_with_metadata(raw_df, metadata)
    pd.testing.assert_frame_equal(processed1, processed2)


def test_all_features_numeric(raw_df):
    processed_df, _ = fit_preprocessing(raw_df)
    for col in processed_df.columns:
        assert pd.api.types.is_numeric_dtype(processed_df[col].dtype), f"{col} is not numeric"
