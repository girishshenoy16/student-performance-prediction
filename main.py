import sys
import os
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))

from src.data_validation import validate_dataset, RAW_DATA_PATH
from src.preprocessing import fit_preprocessing
from src.feature_engineering import add_engineered_features, validate_no_target_leakage
from src.train_model import train_models
from src.evaluate import evaluate_models, select_winning_model, get_feature_importance
from src.export_artifacts import export_artifacts, generate_overview_data


def main():
    print("=" * 60)
    print("STUDENT PERFORMANCE PREDICTION SYSTEM")
    print("=" * 60)

    print("\n[1/7] Validating dataset...")
    report = validate_dataset()
    if report["errors"]:
        print(f"  ERRORS: {report['errors']}")
        return
    print(f"  Rows: {report['row_count']}, Columns: {report['col_count']}")
    print(f"  Target stats: mean={report['target_stats']['mean']:.2f}, "
          f"std={report['target_stats']['std']:.2f}")

    print("\n[2/7] Loading raw data...")
    df = pd.read_csv(RAW_DATA_PATH)
    print(f"  Loaded {len(df)} rows")

    print("\n[3/7] Preprocessing...")
    processed_df, metadata = fit_preprocessing(df)
    print(f"  Features: {len(metadata['feature_columns'])}")

    print("\n[4/7] Feature engineering...")
    processed_df = add_engineered_features(processed_df)
    validate_no_target_leakage(processed_df)
    print(f"  Total features after engineering: {len(processed_df.columns) - 1}")

    print("\n[5/7] Exporting processed dataset...")
    os.makedirs("data/processed", exist_ok=True)
    processed_path = os.path.join("data", "processed", "processed_student_data.csv")
    processed_df.to_csv(processed_path, index=False)
    print(f"  Saved to {processed_path}")

    print("\n[6/7] Training models...")
    training_results = train_models(processed_df)
    print(f"  Models trained: {list(training_results['models'].keys())}")

    print("\n[7/7] Evaluating models...")
    evaluation_results = evaluate_models(training_results)
    for name, metrics in evaluation_results.items():
        print(f"  {name}: MAE={metrics['MAE']:.4f}, RMSE={metrics['RMSE']:.4f}, R2={metrics['R2']:.4f}")

    winning_model = select_winning_model(evaluation_results)
    print(f"\n  WINNING MODEL: {winning_model}")

    feature_importance = get_feature_importance(
        training_results["models"][winning_model],
        training_results["feature_names"],
        winning_model
    )

    print("\n[BONUS] Exporting artifacts...")
    artifacts_path = export_artifacts(
        winning_model,
        training_results["models"],
        metadata,
        evaluation_results,
        feature_importance,
        training_results["feature_names"]
    )
    print(f"  Artifacts: {artifacts_path}")

    overview_path = generate_overview_data(
        df, evaluation_results, feature_importance, winning_model
    )
    print(f"  Overview data: {overview_path}")

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
