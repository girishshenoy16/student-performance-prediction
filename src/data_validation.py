import pandas as pd
import numpy as np
import os


RAW_DATA_PATH = os.path.join("data", "raw", "StudentPerformanceFactors.csv")
TARGET_COLUMN = "Exam_Score"

REQUIRED_COLUMNS = [
    "Hours_Studied", "Attendance", "Parental_Involvement", "Access_to_Resources",
    "Extracurricular_Activities", "Sleep_Hours", "Previous_Scores",
    "Motivation_Level", "Internet_Access", "Tutoring_Sessions", "Family_Income",
    "Teacher_Quality", "School_Type", "Peer_Influence", "Physical_Activity",
    "Learning_Disabilities", "Parental_Education_Level", "Distance_from_Home",
    "Gender", "Exam_Score"
]

CATEGORICAL_COLUMNS = [
    "Parental_Involvement", "Access_to_Resources", "Extracurricular_Activities",
    "Motivation_Level", "Internet_Access", "Family_Income", "Teacher_Quality",
    "School_Type", "Peer_Influence", "Learning_Disabilities",
    "Parental_Education_Level", "Distance_from_Home", "Gender"
]

NUMERIC_COLUMNS = [
    "Hours_Studied", "Attendance", "Sleep_Hours", "Previous_Scores",
    "Tutoring_Sessions", "Physical_Activity"
]


def validate_dataset(filepath=None):
    if filepath is None:
        filepath = RAW_DATA_PATH

    report = {
        "file_exists": False,
        "row_count": 0,
        "col_count": 0,
        "columns": [],
        "missing_columns": [],
        "null_counts": {},
        "duplicate_rows": 0,
        "target_present": False,
        "target_stats": {},
        "dtypes": {},
        "errors": [],
        "warnings": []
    }

    if not os.path.exists(filepath):
        report["errors"].append(f"File not found: {filepath}")
        return report

    report["file_exists"] = True

    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        report["errors"].append(f"Failed to read CSV: {e}")
        return report

    report["row_count"] = len(df)
    report["col_count"] = len(df.columns)
    report["columns"] = df.columns.tolist()

    if report["row_count"] == 0:
        report["errors"].append("Dataset is empty")
        return report

    if TARGET_COLUMN not in df.columns:
        report["errors"].append(f"Target column '{TARGET_COLUMN}' not found")
        return report

    report["target_present"] = True
    report["target_stats"] = {
        "mean": float(df[TARGET_COLUMN].mean()),
        "std": float(df[TARGET_COLUMN].std()),
        "min": float(df[TARGET_COLUMN].min()),
        "max": float(df[TARGET_COLUMN].max()),
        "median": float(df[TARGET_COLUMN].median()),
    }

    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    report["missing_columns"] = missing_cols
    if missing_cols:
        report["errors"].append(f"Missing required columns: {missing_cols}")

    null_counts = df.isnull().sum()
    report["null_counts"] = {k: int(v) for k, v in null_counts.items() if v > 0}

    report["duplicate_rows"] = int(df.duplicated().sum())

    for col in df.columns:
        report["dtypes"][col] = str(df[col].dtype)

    for col in NUMERIC_COLUMNS:
        if col in df.columns:
            vals = df[col].dropna()
            if vals.min() < 0:
                report["warnings"].append(f"{col} has negative values (min={vals.min()})")

    if TARGET_COLUMN in df.columns:
        t = df[TARGET_COLUMN]
        if t.min() < 0 or t.max() > 100:
            report["warnings"].append(
                f"Exam_Score range [{t.min()}, {t.max()}] outside [0, 100]"
            )

    return report


def check_target_leakage(feature_columns):
    if TARGET_COLUMN in feature_columns:
        raise ValueError(
            f"TARGET LEAKAGE: '{TARGET_COLUMN}' found in predictor features. "
            "The target column must never be used as an input feature."
        )
    return True
