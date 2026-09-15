import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple


def fit_preprocessing(df: pd.DataFrame, target_col: str = "Exam_Score") -> Tuple[pd.DataFrame, Dict[str, Any]]:
    df = df.copy()

    categorical_cols = [
        "Parental_Involvement", "Access_to_Resources", "Extracurricular_Activities",
        "Motivation_Level", "Internet_Access", "Family_Income", "Teacher_Quality",
        "School_Type", "Peer_Influence", "Learning_Disabilities",
        "Parental_Education_Level", "Distance_from_Home", "Gender"
    ]

    numeric_cols = [
        "Hours_Studied", "Attendance", "Sleep_Hours", "Previous_Scores",
        "Tutoring_Sessions", "Physical_Activity"
    ]

    for col in categorical_cols:
        if col in df.columns:
            mode_val = df[col].mode()
            if len(mode_val) > 0:
                df[col] = df[col].fillna(mode_val.iloc[0])
            else:
                df[col] = df[col].fillna("Unknown")

    for col in numeric_cols:
        if col in df.columns:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)

    categorical_mappings = {}
    categorical_modes = {}
    for col in categorical_cols:
        if col in df.columns:
            mode_val = df[col].mode()
            categorical_modes[col] = mode_val.iloc[0] if len(mode_val) > 0 else None
            unique_vals = sorted(df[col].dropna().unique())
            mapping = {val: idx for idx, val in enumerate(unique_vals)}
            categorical_mappings[col] = mapping
            df[col] = df[col].map(mapping)

    feature_columns = [c for c in df.columns if c != target_col]

    scaler_means = {}
    scaler_stds = {}
    for col in feature_columns:
        if col in numeric_cols:
            mean_val = float(df[col].mean())
            std_val = float(df[col].std())
            if std_val == 0:
                std_val = 1.0
            scaler_means[col] = mean_val
            scaler_stds[col] = std_val
            df[col] = (df[col] - mean_val) / std_val

    metadata = {
        "feature_columns": feature_columns,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "categorical_mappings": categorical_mappings,
        "categorical_modes": categorical_modes,
        "scaler_means": scaler_means,
        "scaler_stds": scaler_stds,
        "target_column": target_col
    }

    return df, metadata


def transform_with_metadata(df: pd.DataFrame, metadata: Dict[str, Any]) -> pd.DataFrame:
    df = df.copy()

    categorical_cols = metadata["categorical_columns"]
    numeric_cols = metadata["numeric_columns"]
    categorical_mappings = metadata["categorical_mappings"]
    categorical_modes = metadata.get("categorical_modes", {})
    scaler_means = metadata["scaler_means"]
    scaler_stds = metadata["scaler_stds"]

    for col in categorical_cols:
        if col in df.columns:
            mode_val = categorical_modes.get(col)
            if mode_val is not None:
                df[col] = df[col].fillna(mode_val)
            mapping = categorical_mappings.get(col, {})
            df[col] = df[col].map(mapping)
            df[col] = df[col].fillna(-1).astype(int)

    for col in numeric_cols:
        if col in df.columns:
            mean_val = scaler_means.get(col, 0)
            std_val = scaler_stds.get(col, 1)
            df[col] = (df[col] - mean_val) / std_val

    return df
