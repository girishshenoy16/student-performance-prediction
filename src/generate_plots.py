"""Generate all project plots and charts as PNG images."""

import json
import os
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker


def generate_plots(output_dir="outputs"):
    """Generate 8 static PNG charts from project artifacts and save to output_dir."""
    os.makedirs(output_dir, exist_ok=True)

    df = pd.read_csv("data/raw/StudentPerformanceFactors.csv")
    with open("docs/overview_data.json", "r") as f:
        ov = json.load(f)
    with open("docs/artifacts.json", "r") as f:
        art = json.load(f)

    NAVY = "#172033"
    BLUE = "#2563EB"
    TEAL = "#0D9488"
    RED = "#DC2626"
    AMBER = "#D97706"
    INDIGO = "#4F46E5"
    GRAY = "#526174"

    plt.rcParams.update({
        'font.family': 'sans-serif',
        'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
        'font.size': 12,
        'axes.titlesize': 14,
        'axes.titleweight': 'bold',
        'axes.labelsize': 12,
        'xtick.labelsize': 11,
        'ytick.labelsize': 11,
        'axes.spines.top': False,
        'axes.spines.right': False,
        'figure.facecolor': 'white',
        'axes.facecolor': 'white',
        'axes.edgecolor': '#E2E8F0',
        'grid.color': '#E2E8F0',
        'grid.linewidth': 0.8,
    })

    # ── 1. Exam Score Distribution ──
    fig, ax = plt.subplots(figsize=(10, 5))
    bins = ov['exam_score_distribution']['bins']
    counts = ov['exam_score_distribution']['counts']
    labels = [f"{bins[i]}\u2013{bins[i+1]-1}" for i in range(len(bins)-1)]
    colors = [RED if i == 0 else AMBER if i == 1 else BLUE if i == 2 else TEAL if i < 4 else INDIGO for i in range(len(counts))]
    bars = ax.bar(labels, counts, color=colors, edgecolor='white', linewidth=0.5, width=0.7)
    for bar, count in zip(bars, counts):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 30, f'{count:,}', ha='center', va='bottom', fontsize=10, fontweight='bold', color=NAVY)
    ax.set_title('Exam Score Distribution', pad=15)
    ax.set_xlabel('Score Range')
    ax.set_ylabel('Number of Students')
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, p: f'{int(x):,}'))
    ax.grid(axis='y', alpha=0.5)
    plt.tight_layout()
    fig.savefig(os.path.join(output_dir, 'exam_score_distribution.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print("OK exam_score_distribution.png")

    # ── 2. Performance Category Distribution ──
    fig, ax = plt.subplots(figsize=(8, 5))
    cats = ov['performance_categories']
    cat_names = list(cats.keys())
    cat_vals = list(cats.values())
    cat_colors = [RED, AMBER, BLUE, TEAL]
    bars = ax.barh(cat_names, cat_vals, color=cat_colors, edgecolor='white', height=0.6)
    for bar, val, pct in zip(bars, cat_vals, ov['performance_category_percentages'].values()):
        ax.text(bar.get_width() + 50, bar.get_y() + bar.get_height()/2, f'{val:,} ({pct}%)', va='center', fontsize=11, fontweight='bold', color=NAVY)
    ax.set_title('Performance Category Distribution', pad=15)
    ax.set_xlabel('Number of Students')
    ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, p: f'{int(x):,}'))
    ax.grid(axis='x', alpha=0.5)
    ax.invert_yaxis()
    plt.tight_layout()
    fig.savefig(os.path.join(output_dir, 'performance_categories.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print("OK performance_categories.png")

    # ── 3. Study Hours vs Exam Score Scatter ──
    fig, ax = plt.subplots(figsize=(10, 6))
    x = ov['study_hours_vs_score']['x']
    y = ov['study_hours_vs_score']['y']
    ax.scatter(x, y, alpha=0.15, s=8, color=BLUE, edgecolors='none')
    z = np.polyfit(x, y, 1)
    p = np.poly1d(z)
    x_line = np.linspace(min(x), max(x), 100)
    ax.plot(x_line, p(x_line), color=RED, linewidth=2, linestyle='--', label=f'Trend (r = +0.445)')
    ax.set_title('Study Hours vs Exam Score', pad=15)
    ax.set_xlabel('Hours Studied per Week')
    ax.set_ylabel('Exam Score')
    ax.legend(frameon=False)
    ax.grid(alpha=0.5)
    plt.tight_layout()
    fig.savefig(os.path.join(output_dir, 'study_hours_vs_score.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print("OK study_hours_vs_score.png")

    # ── 4. Attendance vs Exam Score Scatter ──
    fig, ax = plt.subplots(figsize=(10, 6))
    x = ov['attendance_vs_score']['x']
    y = ov['attendance_vs_score']['y']
    ax.scatter(x, y, alpha=0.15, s=8, color=TEAL, edgecolors='none')
    z = np.polyfit(x, y, 1)
    p = np.poly1d(z)
    x_line = np.linspace(min(x), max(x), 100)
    ax.plot(x_line, p(x_line), color=RED, linewidth=2, linestyle='--', label=f'Trend (r = +0.581)')
    ax.set_title('Attendance vs Exam Score', pad=15)
    ax.set_xlabel('Attendance (%)')
    ax.set_ylabel('Exam Score')
    ax.legend(frameon=False)
    ax.grid(alpha=0.5)
    plt.tight_layout()
    fig.savefig(os.path.join(output_dir, 'attendance_vs_score.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print("OK attendance_vs_score.png")

    # ── 5. Feature Importance ──
    fig, ax = plt.subplots(figsize=(10, 7))
    imp = ov['normalized_importance']
    sorted_imp = sorted(imp.items(), key=lambda x: x[1], reverse=True)[:12]
    features = [k.replace('_', ' ') for k, v in sorted_imp]
    values = [v for k, v in sorted_imp]
    colors = [TEAL if i == 0 else BLUE if i < 4 else INDIGO for i in range(len(features))]
    bars = ax.barh(features[::-1], values[::-1], color=colors[::-1], edgecolor='white', height=0.6)
    for bar, val in zip(bars, values[::-1]):
        ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2, f'{val:.1f}%', va='center', fontsize=10, fontweight='bold', color=NAVY)
    ax.set_title('Feature Importance (Normalized)', pad=15)
    ax.set_xlabel('Relative Importance (%)')
    ax.grid(axis='x', alpha=0.5)
    plt.tight_layout()
    fig.savefig(os.path.join(output_dir, 'feature_importance.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print("OK feature_importance.png")

    # ── 6. Model Comparison ──
    fig, ax = plt.subplots(figsize=(9, 5))
    bench = ov['model_benchmark']
    models = [b['model_display'] for b in bench]
    r2_scores = [b['R2'] for b in bench]
    mae_scores = [b['MAE'] for b in bench]
    winner_idx = next(i for i, b in enumerate(bench) if b['model'] == ov['winning_model'])
    colors = [TEAL if i == winner_idx else GRAY for i in range(len(models))]

    x_pos = np.arange(len(models))
    width = 0.35
    bars1 = ax.bar(x_pos - width/2, r2_scores, width, label='R\u00b2', color=colors, edgecolor='white')
    bars2 = ax.bar(x_pos + width/2, mae_scores, width, label='MAE', color=[TEAL if i == winner_idx else '#94A3B8' for i in range(len(models))], edgecolor='white', alpha=0.6)

    for bar, val in zip(bars1, r2_scores):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01, f'{val:.4f}', ha='center', va='bottom', fontsize=9, fontweight='bold', color=NAVY)
    for bar, val in zip(bars2, mae_scores):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01, f'{val:.4f}', ha='center', va='bottom', fontsize=9, fontweight='bold', color=NAVY)

    ax.set_title('Model Comparison', pad=15)
    ax.set_xticks(x_pos)
    ax.set_xticklabels(models, fontsize=11)
    ax.set_ylabel('Score')
    ax.legend(frameon=False)
    ax.grid(axis='y', alpha=0.5)
    plt.tight_layout()
    fig.savefig(os.path.join(output_dir, 'model_comparison.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print("OK model_comparison.png")

    # ── 7. Top Predictive Signals ──
    fig, ax = plt.subplots(figsize=(10, 5))
    fi = art['feature_importance']
    sorted_fi = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:8]
    features = [k.replace('_', ' ') for k, v in sorted_fi]
    values = [v for k, v in sorted_fi]
    colors = [RED if v < 0 else TEAL for v in values]
    bars = ax.barh(features[::-1], values[::-1], color=colors[::-1], edgecolor='white', height=0.6)
    for bar, val in zip(bars, values[::-1]):
        ax.text(bar.get_width() + 0.05, bar.get_y() + bar.get_height()/2, f'{val:.3f}', va='center', fontsize=10, fontweight='bold', color=NAVY)
    ax.set_title('Top Model-Derived Predictive Signals', pad=15)
    ax.set_xlabel('Absolute Coefficient Weight')
    ax.grid(axis='x', alpha=0.5)
    plt.tight_layout()
    fig.savefig(os.path.join(output_dir, 'top_signals.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print("OK top_signals.png")

    # ── 8. Dataset Overview ──
    fig, axes = plt.subplots(1, 3, figsize=(14, 4.5))

    miss = {'Teacher_Quality': 78, 'Parental_Education_Level': 90, 'Distance_from_Home': 67}
    axes[0].barh(list(miss.keys()), list(miss.values()), color=AMBER, edgecolor='white', height=0.5)
    for i, (k, v) in enumerate(miss.items()):
        axes[0].text(v + 1, i, str(v), va='center', fontsize=11, fontweight='bold', color=NAVY)
    axes[0].set_title('Missing Values by Column')
    axes[0].set_xlabel('Count')
    axes[0].grid(axis='x', alpha=0.5)

    numeric_cols = ['Hours_Studied', 'Attendance', 'Sleep_Hours', 'Previous_Scores', 'Tutoring_Sessions', 'Physical_Activity']
    bp_data = [df[col].dropna().values for col in numeric_cols]
    bp = axes[1].boxplot(bp_data, tick_labels=[c.replace('_', '\n') for c in numeric_cols], patch_artist=True, widths=0.5)
    for patch, color in zip(bp['boxes'], [BLUE, TEAL, INDIGO, AMBER, RED, '#8B5CF6']):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)
    axes[1].set_title('Numeric Feature Distributions')
    axes[1].set_ylabel('Value')
    axes[1].grid(axis='y', alpha=0.5)
    axes[1].tick_params(axis='x', labelsize=9)

    axes[2].hist(df['Exam_Score'], bins=20, color=BLUE, edgecolor='white', alpha=0.8)
    axes[2].axvline(df['Exam_Score'].mean(), color=RED, linestyle='--', linewidth=1.5, label=f'Mean: {df["Exam_Score"].mean():.1f}')
    axes[2].set_title('Exam Score Histogram')
    axes[2].set_xlabel('Exam Score')
    axes[2].set_ylabel('Frequency')
    axes[2].legend(frameon=False)
    axes[2].grid(axis='y', alpha=0.5)

    plt.tight_layout()
    fig.savefig(os.path.join(output_dir, 'dataset_overview.png'), dpi=150, bbox_inches='tight')
    plt.close()
    print("OK dataset_overview.png")

    print(f"\nAll 8 plots saved to {output_dir}/")
    return output_dir
