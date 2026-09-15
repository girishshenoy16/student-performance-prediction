import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Any


def evaluate_models(training_results: Dict[str, Any]) -> Dict[str, Any]:
    models = training_results["models"]
    X_test = training_results["X_test"]
    y_test = training_results["y_test"]

    results = {}
    for name, model in models.items():
        y_pred = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))
        results[name] = {
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2,
            "predictions": y_pred
        }

    return results


def select_winning_model(evaluation_results: Dict[str, Any]) -> str:
    """Select the winning model based on the highest test-set R² score.

    Selection Criterion (primary):
        The model with the highest R² (coefficient of determination) on the
        held-out 20% test split is selected as the winning model.

    Rationale:
        R² measures the proportion of variance in Exam_Score explained by the
        model. A higher R² indicates better overall fit to the data.

    Secondary metrics (MAE, RMSE) are reported for complementary evaluation
    but do not determine the winner.

    If multiple models share the same R², the first encountered model wins.
    """
    best_model = None
    best_r2 = -float("inf")

    for name, metrics in evaluation_results.items():
        if metrics["R2"] > best_r2:
            best_r2 = metrics["R2"]
            best_model = name

    return best_model


def get_feature_importance(model, feature_names: list, model_name: str) -> Dict[str, float]:
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        importances = np.abs(model.coef_)
    else:
        return {}

    if len(importances) != len(feature_names):
        return {}

    importance_dict = dict(zip(feature_names, importances.tolist()))
    sorted_importance = dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
    return sorted_importance
