import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.data_validation import validate_dataset, check_target_leakage, RAW_DATA_PATH, TARGET_COLUMN


def test_dataset_exists():
    report = validate_dataset()
    assert report["file_exists"], "Dataset file not found"


def test_dataset_not_empty():
    report = validate_dataset()
    assert report["row_count"] > 0, "Dataset is empty"


def test_target_column_present():
    report = validate_dataset()
    assert report["target_present"], f"Target column '{TARGET_COLUMN}' not found"


def test_required_columns_present():
    report = validate_dataset()
    assert len(report["missing_columns"]) == 0, f"Missing columns: {report['missing_columns']}"


def test_no_target_leakage():
    features = ["Hours_Studied", "Attendance", "Previous_Scores", TARGET_COLUMN]
    with pytest.raises(ValueError, match="TARGET LEAKAGE"):
        check_target_leakage(features)


def test_clean_features_pass_leakage_check():
    features = ["Hours_Studied", "Attendance", "Previous_Scores"]
    result = check_target_leakage(features)
    assert result is True


def test_dataset_no_duplicates():
    report = validate_dataset()
    assert report["duplicate_rows"] == 0, f"Found {report['duplicate_rows']} duplicate rows"


def test_target_statistics_reasonable():
    report = validate_dataset()
    stats = report["target_stats"]
    assert 0 < stats["mean"] < 100
    assert stats["min"] >= 0
    assert stats["std"] > 0


def test_no_errors_in_validation():
    report = validate_dataset()
    assert len(report["errors"]) == 0, f"Validation errors: {report['errors']}"
