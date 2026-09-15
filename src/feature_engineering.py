import pandas as pd
import numpy as np
from typing import Dict, Any


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    if "Hours_Studied" in df.columns and "Previous_Scores" in df.columns:
        df["Study_Efficiency_Index"] = df["Hours_Studied"] * df["Previous_Scores"] / 100.0

    if "Attendance" in df.columns and "Hours_Studied" in df.columns:
        df["Engagement_Score"] = df["Attendance"] * df["Hours_Studied"] / 100.0

    if "Hours_Studied" in df.columns and "Sleep_Hours" in df.columns:
        df["Study_Sleep_Ratio"] = df["Hours_Studied"] / df["Sleep_Hours"].replace(0, 1)

    return df


def get_engineered_feature_names() -> list:
    return ["Study_Efficiency_Index", "Engagement_Score", "Study_Sleep_Ratio"]


def validate_no_target_leakage(df: pd.DataFrame, target_col: str = "Exam_Score"):
    engineered_cols = get_engineered_feature_names()
    for col in engineered_cols:
        if col == target_col:
            raise ValueError(f"Target leakage: engineered feature '{col}' equals target column")
    return True
