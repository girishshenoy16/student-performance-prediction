import json
import os
import numpy as np
import pandas as pd
from typing import Dict, Any
from src.data_validation import RAW_DATA_PATH, TARGET_COLUMN, CATEGORICAL_COLUMNS, NUMERIC_COLUMNS


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


def export_linear_regression_artifacts(model, metadata: Dict[str, Any], feature_names: list) -> Dict[str, Any]:
    return {
        "model_type": "linear_regression",
        "intercept": float(model.intercept_),
        "coefficients": model.coef_.tolist(),
        "feature_names": feature_names,
        "scaler_means": metadata["scaler_means"],
        "scaler_stds": metadata["scaler_stds"],
        "categorical_mappings": metadata["categorical_mappings"],
        "categorical_modes": metadata.get("categorical_modes", {}),
        "feature_columns": feature_names,
    }


def export_tree_model_artifacts(model, metadata: Dict[str, Any], model_type: str, feature_names: list) -> Dict[str, Any]:
    def serialize_tree(tree, feature_names):
        tree_data = {
            "feature": feature_names[tree.feature] if tree.feature >= 0 else None,
            "threshold": float(tree.threshold),
            "value": float(tree.value[0][0]) if hasattr(tree.value, '__len__') else float(tree.value),
            "left": None,
            "right": None,
        }
        if tree.children_left >= 0:
            tree_data["left"] = serialize_tree(
                model.estimators_[0].tree_ if hasattr(model, 'estimators_') else tree,
                feature_names
            ) if hasattr(model, 'estimators_') else None
        return tree_data

    if model_type == "random_forest":
        trees = []
        for estimator in model.estimators_:
            t = estimator.tree_
            tree_dict = {
                "feature": t.feature.tolist(),
                "threshold": t.threshold.tolist(),
                "value": t.value.tolist(),
                "children_left": t.children_left.tolist(),
                "children_right": t.children_right.tolist(),
            }
            trees.append(tree_dict)

        return {
            "model_type": "random_forest",
            "n_estimators": model.n_estimators,
            "trees": trees,
            "feature_names": feature_names,
            "scaler_means": metadata["scaler_means"],
            "scaler_stds": metadata["scaler_stds"],
            "categorical_mappings": metadata["categorical_mappings"],
            "categorical_modes": metadata.get("categorical_modes", {}),
            "feature_columns": feature_names,
            "feature_importances": model.feature_importances_.tolist(),
        }

    elif model_type == "xgboost":
        booster = model.get_booster()
        booster_str = booster.save_raw()

        return {
            "model_type": "xgboost",
            "n_estimators": model.n_estimators,
            "booster_raw": booster_str.decode("utf-8") if isinstance(booster_str, bytes) else booster_str,
            "feature_names": feature_names,
            "scaler_means": metadata["scaler_means"],
            "scaler_stds": metadata["scaler_stds"],
            "categorical_mappings": metadata["categorical_mappings"],
            "categorical_modes": metadata.get("categorical_modes", {}),
            "feature_columns": feature_names,
            "feature_importances": model.feature_importances_.tolist(),
        }

    return {}


def export_artifacts(
    winning_model_name: str,
    trained_models: Dict[str, Any],
    metadata: Dict[str, Any],
    evaluation_results: Dict[str, Any],
    feature_importance: Dict[str, float],
    feature_names: list,
    output_dir: str = "docs"
) -> str:
    os.makedirs(output_dir, exist_ok=True)

    model = trained_models[winning_model_name]

    if winning_model_name == "linear_regression":
        artifacts = export_linear_regression_artifacts(model, metadata, feature_names)
    elif winning_model_name in ("random_forest", "xgboost"):
        artifacts = export_tree_model_artifacts(model, metadata, winning_model_name, feature_names)
    else:
        raise ValueError(f"Unknown model type: {winning_model_name}")

    artifacts["winning_model"] = winning_model_name
    display_name = winning_model_name.replace("_", " ").title()
    if "Xgboost" in display_name:
        display_name = "XGBoost"
    artifacts["winning_model_display"] = display_name
    best_r2 = evaluation_results.get(winning_model_name, {}).get("R2", 0)
    artifacts["selection_metric"] = "R2"
    artifacts["selection_reason"] = (
        f"Selected because it achieved the highest test-set R² "
        f"({best_r2:.4f}) among all evaluated models."
    )
    artifacts["evaluation"] = {
        name: {k: v for k, v in metrics.items() if k != "predictions"}
        for name, metrics in evaluation_results.items()
    }
    artifacts["feature_importance"] = feature_importance

    artifacts_path = os.path.join(output_dir, "artifacts.json")
    with open(artifacts_path, "w") as f:
        json.dump(artifacts, f, cls=NumpyEncoder, indent=2)

    return artifacts_path


def generate_overview_data(
    df: pd.DataFrame,
    evaluation_results: Dict[str, Any],
    feature_importance: Dict[str, float],
    winning_model: str,
    output_dir: str = "docs"
) -> str:
    os.makedirs(output_dir, exist_ok=True)

    target = df[TARGET_COLUMN]
    total = len(target)

    cat_counts = {
        "At Risk": int((target < 60).sum()),
        "Average": int(((target >= 60) & (target < 75)).sum()),
        "Good": int(((target >= 75) & (target < 85)).sum()),
        "Excellent": int((target >= 85).sum()),
    }
    cat_pcts = {k: round(v / total * 100, 1) for k, v in cat_counts.items()}

    total_imp = sum(feature_importance.values()) if feature_importance else 1
    normalized_importance = {k: round(v / total_imp * 100, 1) for k, v in feature_importance.items()}

    best_metrics = evaluation_results.get(winning_model, {})
    selection_metric = "R2"
    selection_reason = (
        f"Selected because it achieved the highest test-set R² "
        f"({best_metrics.get('R2', 0):.4f}) among all evaluated models."
    )

    study_corr = float(np.corrcoef(df["Hours_Studied"], target)[0, 1])
    attend_corr = float(np.corrcoef(df["Attendance"], target)[0, 1])
    prev_corr = float(np.corrcoef(df["Previous_Scores"], target)[0, 1])

    winning_display = winning_model.replace("_", " ").title()

    insights = []
    insights.append({
        "type": "relationship",
        "text": f"Study Hours shows a positive observed correlation ({study_corr:.3f}) with Exam Score."
    })
    insights.append({
        "type": "relationship",
        "text": f"Attendance shows a positive observed correlation ({attend_corr:.3f}) with Exam Score."
    })
    insights.append({
        "type": "relationship",
        "text": f"Previous Scores shows a positive observed correlation ({prev_corr:.3f}) with Exam Score."
    })
    insights.append({
        "type": "distribution",
        "text": f"The largest performance category is '{max(cat_counts, key=cat_counts.get)}' with {cat_counts[max(cat_counts, key=cat_counts.get)]} students ({cat_pcts[max(cat_counts, key=cat_counts.get)]}%)."
    })
    insights.append({
        "type": "model",
        "text": f"{winning_display} achieved the strongest overall performance according to the selected evaluation criterion (R² = {best_metrics.get('R2', 0):.4f})."
    })
    top_feat = list(feature_importance.items())[0] if feature_importance else ("N/A", 0)
    insights.append({
        "type": "signal",
        "text": f"'{top_feat[0].replace('_', ' ')}' is the strongest model-derived predictive signal."
    })

    overview = {
        "kpis": {
            "total_students": total,
            "avg_exam_score": float(target.mean()),
            "avg_study_hours": float(df["Hours_Studied"].mean()),
            "avg_attendance": float(df["Attendance"].mean()),
        },
        "exam_score_distribution": {
            "bins": [55, 60, 65, 70, 75, 80, 85, 90, 95, 101],
            "counts": np.histogram(target, bins=[55, 60, 65, 70, 75, 80, 85, 90, 95, 101])[0].tolist()
        },
        "study_hours_vs_score": {
            "x": df["Hours_Studied"].tolist(),
            "y": df[TARGET_COLUMN].tolist(),
        },
        "attendance_vs_score": {
            "x": df["Attendance"].tolist(),
            "y": df[TARGET_COLUMN].tolist(),
        },
        "performance_categories": cat_counts,
        "performance_category_percentages": cat_pcts,
        "model_benchmark": [],
        "feature_importance": feature_importance,
        "normalized_importance": normalized_importance,
        "winning_model": winning_model,
        "winning_model_display": winning_display,
        "selection_metric": selection_metric,
        "selection_reason": selection_reason,
        "insights": insights
    }

    for name, metrics in evaluation_results.items():
        display = name.replace("_", " ").title()
        if "Xgboost" in display:
            display = "XGBoost"
        overview["model_benchmark"].append({
            "model": name,
            "model_display": display,
            "MAE": round(metrics["MAE"], 4),
            "RMSE": round(metrics["RMSE"], 4),
            "R2": round(metrics["R2"], 4),
        })

    overview_path = os.path.join(output_dir, "overview_data.json")
    with open(overview_path, "w") as f:
        json.dump(overview, f, cls=NumpyEncoder, indent=2)

    return overview_path
