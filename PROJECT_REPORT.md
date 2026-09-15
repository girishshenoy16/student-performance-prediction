# PROJECT REPORT: Student Performance Prediction System

---

## 1. Project Overview

This report documents the end-to-end development of a **Student Performance Prediction System** that predicts continuous `Exam_Score` using the Kaggle Student Performance Factors dataset. The system implements a complete ML pipeline (data validation → preprocessing → feature engineering → model training → evaluation → artifact export) and a portfolio-ready, production-style Power BI-inspired 3-tab dashboard deployed as a fully static application on GitHub Pages.

**Key Results:**

| Metric | Value |
|--------|-------|
| Winning Model | Linear Regression |
| R² | 0.6888 |
| MAE | 1.0165 |
| RMSE | 2.0972 |
| Cross-Runtime Verification | 60 records, tolerance ≤ 0.01 |
| Test Suite | 27/27 passing |
| Deployment | 100% static (GitHub Pages) |

---

## 2. Business Problem & Objectives

### Problem
Educational institutions generate vast amounts of student data but lack actionable predictive tools to identify at-risk students proactively. Traditional assessment methods are reactive — performance is evaluated after outcomes are already determined.

### Objectives
1. Build a regression model to predict continuous exam scores from 19 student factors
2. Compare multiple ML algorithms and select the best performer programmatically
3. Export the winning model to a browser-compatible format for client-side inference
4. Verify cross-runtime consistency (Python ↔ JavaScript) on 50+ records
5. Deploy a polished, accessible, 100% static dashboard for end-user interaction

### Constraints
- No Flask/FastAPI/Streamlit — 100% static deployment
- No synthetic data — real Kaggle dataset only
- No SHAP/explainability libraries — model signals only
- No hyperparameter optimization — fixed configurations
- Feature freeze — no scope creep

---

## 3. Dataset & Data Quality

### Source
**Student Performance Factors** (Kaggle) — immutable source of truth at `data/raw/StudentPerformanceFactors.csv`.

### Schema

| Property | Value |
|----------|-------|
| Rows | 6,607 |
| Columns | 20: 6 numeric predictor features, 13 categorical predictor features, and 1 numeric target (Exam_Score) |
| Target | `Exam_Score` (int64) |
| Target Range | 55 – 101 |
| Target Mean | 67.24 |
| Target Std | 3.89 |
| Duplicates | 0 |

### Missing Values

| Column | Missing Count |
|--------|--------------|
| Teacher_Quality | 78 |
| Parental_Education_Level | 90 |
| Distance_from_Home | 67 |

![Dataset Overview](outputs/dataset_overview.png)

### Feature List

**Numeric (6):** Hours_Studied, Attendance, Sleep_Hours, Previous_Scores, Tutoring_Sessions, Physical_Activity

**Categorical (13):** Parental_Involvement, Access_to_Resources, Extracurricular_Activities, Motivation_Level, Internet_Access, Family_Income, Teacher_Quality, School_Type, Peer_Influence, Learning_Disabilities, Parental_Education_Level, Distance_from_Home, Gender

---

## 4. Data Pipeline & Preprocessing

### Pipeline Overview

```
Raw CSV → Validation → Imputation → Encoding → Scaling → Feature Engineering → Processed CSV
```

### Data Validation (`src/data_validation.py`)
- Schema inspection: file existence, row/column counts, data types
- Target column presence and type verification
- Missing value detection and reporting
- Duplicate detection
- Target leakage check: `Exam_Score ∉ predictor_features`
- Numerical range validation
- Categorical value validation

### Preprocessing (`src/preprocessing.py`)

| Step | Method |
|------|--------|
| Missing Values (Categorical) | Mode imputation |
| Missing Values (Numeric) | Median imputation |
| Categorical Encoding | Ordinal integer mapping (sorted alphabetically) |
| Feature Scaling | Z-score normalization (mean=0, std=1) |

### Metadata Export
Scaler parameters (means, stds), categorical mappings, and mode values are exported to `docs/artifacts.json` for JavaScript reproduction.

### Processed Dataset
`data/processed/processed_student_data.csv` — 6,607 rows × 23 columns (19 original features + 3 engineered + target).

---

## 5. Feature Engineering

Three leakage-safe interaction features were engineered strictly without `Exam_Score`:

| Feature | Formula | Rationale |
|---------|---------|-----------|
| Study_Efficiency_Index | Hours_Studied × Previous_Scores / 100 | Interaction between study effort and prior performance |
| Engagement_Score | Attendance × Hours_Studied / 100 | Combined attendance-study engagement metric |
| Study_Sleep_Ratio | Hours_Studied / Sleep_Hours | Study intensity relative to rest |

All features are computed on scaled values (scale first, then engineer) to maintain consistency across training, testing, and inference.

---

## 6. Machine Learning Models

### Training Configuration
- **Split:** 80% train / 20% test (random_state=42)
- **Models:** Linear Regression, Random Forest (100 trees, random_state=42), XGBoost (100 estimators, random_state=42)

### Model Descriptions

| Model | Type | Key Parameters |
|-------|------|---------------|
| Linear Regression | Ordinary Least Squares | Default |
| Random Forest | Ensemble (bagging) | n_estimators=100, random_state=42 |
| XGBoost | Ensemble (boosting) | n_estimators=100, random_state=42 |

---

## 7. Model Evaluation & Selection

### Evaluation Metrics

| Metric | Description |
|--------|-------------|
| MAE | Mean Absolute Error — average absolute difference between predicted and actual |
| RMSE | Root Mean Squared Error — penalizes larger errors more heavily |
| R² | Coefficient of determination — proportion of variance explained |

### Results

| Model | MAE | RMSE | R² |
|-------|-----|------|-----|
| **Linear Regression** | **1.0165** | **2.0972** | **0.6888** |
| Random Forest | 1.1613 | 2.2690 | 0.6358 |
| XGBoost | 0.9654 | 2.1874 | 0.6615 |

![Model Comparison](outputs/model_comparison.png)

### Winner Selection
The winning model (Linear Regression) was selected programmatically based on highest R² score. Despite having slightly higher MAE than XGBoost (1.0165 vs 0.9654), Linear Regression achieved the best overall fit (R² = 0.6888) while maintaining full transparency and complete JavaScript reproducibility via exported coefficients and intercept.

### Predictive Factor Analysis

| Rank | Feature | Coefficient Weight | Normalized Importance |
|------|---------|-------------------|----------------------|
| 1 | Engagement Score | 4.078 | 24.0% |
| 2 | Study Efficiency Index | 2.347 | 13.8% |
| 3 | Attendance | 2.285 | 13.4% |
| 4 | Hours Studied | 1.710 | 10.1% |
| 5 | Internet Access | 0.971 | 5.7% |
| 6 | Learning Disabilities | 0.878 | 5.2% |
| 7 | Previous Scores | 0.693 | 4.1% |
| 8 | Tutoring Sessions | 0.618 | 3.6% |

*Note: These are model-derived predictive signals indicating feature contribution to the linear model, not causal explanations.*

![Top Predictive Signals](outputs/top_signals.png)

![Feature Importance](outputs/feature_importance.png)

---

## 8. Prediction / Inference System

### Architecture
A single shared JavaScript prediction engine (`docs/js/predictor.js`) serves both Live Simulation and Batch Prediction, ensuring identical inference logic across use cases.

### Inference Pipeline (JavaScript)
1. Load `docs/artifacts.json` (model coefficients, intercept, scaler parameters, categorical mappings)
2. Preprocess input: scale numeric features (z-score), encode categorical features (ordinal mapping)
3. Compute engineered features (Study_Efficiency_Index, Engagement_Score, Study_Sleep_Ratio) on scaled values
4. Linear prediction: `score = intercept + Σ(coefficient_i × feature_i)`
5. Category assignment: At Risk (< 60), Average (60–74), Good (75–84), Excellent (≥ 85)
6. Top signal computation: `|coefficient_i × feature_i|` for each feature, sorted descending

### Cross-Runtime Verification
- 60 random records sampled from the raw dataset
- Python predictions computed using trained model
- JavaScript predictions computed using `predictor.js` with `artifacts.json`
- Tolerance: 0.01 (absolute difference)
- Result: All 60 predictions match within tolerance

---

## 9. Dashboard Architecture & Features

### Design System
- **Font:** Inter (Google Fonts)
- **Theme:** Light executive analytics (Power BI-inspired)
- **Charts:** Chart.js 4.4.0
- **Responsive:** CSS Grid, mobile-first breakpoints
- **Accessibility:** Keyboard navigation, focus states, semantic HTML, ARIA labels

### Tab 1: Overview

| Component | Description |
|-----------|-------------|
| KPI Cards | Total Students (6,607), Avg Score (67.2), Avg Hours (20.0), Avg Attendance (80.0%) |
| Score Distribution | Bar chart — 9 bins from 55 to 101 |
| Performance Categories | Horizontal bar chart — At Risk (68), Average (6,415), Good (89), Excellent (35) |
| Study Hours vs Score | Scatter plot — 6,607 data points |
| Attendance vs Score | Scatter plot — 6,607 data points |
| Feature Importance | Horizontal bar chart — top 12 features by normalized importance |
| Model Comparison | Bar chart — R² values for all 3 models with winner highlighting |
| Top Predictive Signals | Horizontal bar chart — top 8 features by absolute coefficient weight |
| Benchmark Table | Model comparison with MAE, RMSE, R², winner indicator |
| Data-Driven Insights | 6 insight cards parsed directly from `overview_data.json` |

### Tab 2: Live Simulation

| Feature | Description |
|---------|-------------|
| Dynamic Form | 19 fields (6 numeric, 13 categorical) generated from feature schema |
| Prediction | Real-time client-side inference via shared `predictor.js` |
| Score Display | Predicted Exam Score (XX.X / 100) with performance category badge |
| Quick Assessment | Comparison of user inputs against dataset averages |
| Performance Range | Visual range bar highlighting current category |
| Top Model Signals | Horizontal bar chart of top 6 predictive factors for this profile |
| Recommendations | Profile-specific, data-grounded guidance (study hours, attendance, balance, sleep, tutoring, physical activity) |
| Repeated Predictions | Inputs preserved after prediction — edit and re-predict without Reset |
| Discoverability | Helper message: *"Want to try another scenario? Change any input and predict again."* |

### Tab 3: Batch Prediction

| Feature | Description |
|---------|-------------|
| Upload | Drag-and-drop CSV + file browser |
| Validation | Required-column check (19 columns), extra-column preservation, Exam_Score exclusion |
| Workflow Indicator | 4-step tracker: ✓ Upload → ✓ Validate → ✓ Predict → ✓ Review Results |
| Inference | Batch prediction with progress reporting |
| Results | KPIs, distribution chart, paginated table |
| Download | `student_predictions.csv` with original columns + Predicted_Exam_Score + Performance_Category |
| Template | Sample CSV template download |

### Performance Categories

| Category | Score Range | Count | Percentage |
|----------|------------|-------|-----------|
| At Risk | < 60 | 68 | 1.0% |
| Average | 60–74 | 6,415 | 97.1% |
| Good | 75–84 | 89 | 1.3% |
| Excellent | ≥ 85 | 35 | 0.5% |

---

## 10. Data-Driven Insights

All insights are derived from the actual dataset and model outputs — not hardcoded.

| Insight | Source | Value |
|---------|--------|-------|
| Attendance–Score Correlation | Dataset | +0.581 |
| Study Hours–Score Correlation | Dataset | +0.445 |
| Previous Scores–Score Correlation | Dataset | +0.175 |
| Largest Performance Segment | Dataset | Average — 6,415 students (97.1%) |
| Best Model | Evaluation | Linear Regression (R² = 0.6888) |
| Strongest Model Signal | Model | Engagement Score (24.0% normalized importance) |

*Terminology: These are observed dataset relationships and model-derived signals, not causal claims.*

---

## 11. Generated Artifacts

### `docs/artifacts.json` (5.7 KB)
Exact browser-serializable representation of the winning model:

| Field | Description |
|-------|-------------|
| model_type | `linear_regression` |
| intercept | 66.3885 |
| coefficients | 22 float values (one per feature) |
| feature_names | 22 feature names (19 original + 3 engineered) |
| feature_columns | Ordered feature list for prediction |
| scaler_means | 6 numeric feature means |
| scaler_stds | 6 numeric feature standard deviations |
| categorical_mappings | 13 categorical feature ordinal maps |
| categorical_modes | 13 mode values for NaN fallback |
| winning_model | `linear_regression` |
| winning_model_display | `Linear Regression` |
| selection_reason | Highest test-set R² among evaluated models |
| evaluation | MAE, RMSE, R² for all 3 models |
| feature_importance | Absolute coefficient weights for all 22 features |

### `docs/overview_data.json` (294.7 KB)
Precomputed dashboard data:

| Section | Contents |
|---------|----------|
| kpis | total_students, avg_exam_score, avg_study_hours, avg_attendance |
| exam_score_distribution | bins and counts for histogram |
| study_hours_vs_score | 6,607 (x, y) pairs |
| attendance_vs_score | 6,607 (x, y) pairs |
| performance_categories | At Risk, Average, Good, Excellent counts |
| performance_category_percentages | Category percentages |
| model_benchmark | MAE, RMSE, R² for all 3 models |
| feature_importance | Absolute weights for 22 features |
| normalized_importance | Percentage importance for 22 features |
| insights | 6 data-driven insight objects |

![Study Hours vs Score](outputs/study_hours_vs_score.png)

![Attendance vs Score](outputs/attendance_vs_score.png)

![Exam Score Distribution](outputs/exam_score_distribution.png)

![Performance Categories](outputs/performance_categories.png)

---

## 12. Testing & Quality Assurance

### Python Test Suite (27 tests)

| Module | Tests | Coverage |
|--------|-------|----------|
| test_data_validation.py | 9 | Schema, types, nulls, duplicates, leakage, ranges |
| test_preprocessing.py | 5 | Row preservation, metadata, target exclusion, determinism, numeric output |
| test_feature_engineering.py | 6 | Feature addition, leakage protection, formula accuracy, row/column preservation |
| test_model_export.py | 3 | Prediction match (60 records), minimum sample count, artifacts validity |
| test_batch_prediction.py | 4 | Raw CSV loadable, processed CSV exists, artifacts JSON valid, overview data valid |
| **Total** | **27** | **100% pass rate** |

### JS Verification
- All 4 JS files pass `node --check` syntax validation
- CSS: 307/307 braces balanced
- Cross-runtime: 60 records verified within tolerance ≤ 0.01

---

## 13. Deployment

### GitHub Pages (Recommended)
- Repository root serves as deployment root
- All file paths are relative (`./css/style.css`, `./js/app.js`, `./docs/artifacts.json`)
- Zero backend requirements
- Zero server-side processing

### Local Verification
```bash
python -m http.server 8000 --directory docs
# Access: http://localhost:8000
```

### File Structure

```
Student Performance Prediction System/
├── data/
│   ├── raw/                             # Raw Kaggle dataset
│   └── processed/                       # Preprocessed dataset
├── src/                                 
│   ├── data_validation.py               # 9 tests
│   ├── preprocessing.py                 # 5 tests
│   ├── feature_engineering.py           # 6 tests
│   ├── train_model.py
│   ├── evaluate.py
│   ├── export_artifacts.py
│   └── generate_plots.py               # Generates 8 static PNG plots → outputs/
├── tests/                               
│   ├── test_data_validation.py
│   ├── test_preprocessing.py
│   ├── test_feature_engineering.py
│   ├── test_model_export.py
│   └── test_batch_prediction.py
├── docs/                                # GitHub Pages deployment root
│   ├── index.html                       # 3-tab dashboard
│   ├── artifacts.json                   # Model coefficients & metadata
│   ├── overview_data.json               # Precomputed dashboard data
│   ├── css/style.css                    # Light executive analytics theme
│   ├── assets/
│   │   └── overview.png                 # Dashboard screenshot
│   └── js/
│       ├── predictor.js                 # Shared prediction engine
│       ├── app.js                       # Tab switching & form generation
│       ├── overview.js                  # 7 interactive Chart.js charts
│       └── csv_handler.js              # Batch CSV processing
├── outputs/                             # Gitignored — generated by src/generate_plots.py
│   ├── exam_score_distribution.png
│   ├── performance_categories.png
│   ├── model_comparison.png
│   ├── feature_importance.png
│   ├── top_signals.png
│   ├── study_hours_vs_score.png
│   ├── attendance_vs_score.png
│   └── dataset_overview.png
├── main.py                              # Full pipeline orchestrator
├── requirements.txt
├── README.md
└── PROJECT_REPORT.md
```

---

## 14. Limitations

| Limitation                                     | Impact                                                     |
|------------------------------------------------|------------------------------------------------------------|
| Linear Regression assumes linear relationships | May underfit non-linear patterns                           |
| R² = 0.6888 — moderate explanatory power       | 31.1% of variance unexplained                              |
| No hyperparameter optimization                 | Models use default/fixed configurations                    |
| No real-time data pipeline                     | Dashboard uses static artifacts only                       |
| Class imbalance in performance categories      | Average: 97.1%, making category prediction less meaningful |
| Single-dataset evaluation                      | Generalizability to other institutions unverified          |

---

## 15. Future Scope

| Enhancement                                 | Expected Impact                                         |
|---------------------------------------------|---------------------------------------------------------|
| Hyperparameter tuning (GridSearchCV/Optuna) | Potential R² improvement                                |
| Ensemble stacking (LR + RF + XGBoost)       | Better predictive performance                           |
| SHAP-based explainability                   | Feature-level prediction explanations                   |
| Streamlit/Flask variant                     | Dynamic deployment with database integration            |
| Longitudinal tracking                       | Semester-over-semester performance trends               |
| Multi-target prediction                     | Predict multiple outcomes (GPA, attendance, etc.)       |
| API endpoint                                | REST API for integration with school management systems |

---

## 16. Version / Project Status

| Property     | Value                                        |
|--------------|----------------------------------------------|
| Version      | 1.0.0                                        |
| Status       | Complete — Feature Freeze                    |
| Python       | 3.11.9                                       |
| Dependencies | pandas, numpy, scikit-learn, xgboost, pytest |
| Frontend     | HTML5, CSS3, Vanilla JS, Chart.js 4.4.0      |
| Tests        | 27/27 passing                                |
| Deployment   | GitHub Pages (100% static)                   |

---

*Generated from actual project artifacts — all metrics verified against `docs/artifacts.json`, `docs/overview_data.json`, and test outputs.*
