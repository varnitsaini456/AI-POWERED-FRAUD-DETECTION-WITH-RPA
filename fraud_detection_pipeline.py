"""
=============================================================================
AI-Powered Fraud Detection - Complete ML Pipeline
=============================================================================
Project: AI-Powered Fraud Detection & Prevention Ecosystem with RPA
Team: Rohan Thakur, Yogesh Kumar, Varnit Saini
Mentor: Mrs. Neha Pokhriyal

Models: LightGBM, XGBoost, Random Forest, AdaBoost
Dataset: IEEE-CIS Fraud Detection (Kaggle) - Preprocessed

KEY FIX: SMOTE applied AFTER train-test split to prevent data leakage
=============================================================================
"""

# ============================================================================
# 1. IMPORTS
# ============================================================================
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

# ML Models
import lightgbm as lgb
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier

# Preprocessing & Evaluation
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    precision_score, recall_score, f1_score, accuracy_score,
    roc_curve, precision_recall_curve, average_precision_score
)

# SMOTE
from imblearn.over_sampling import SMOTE

# Explainability
import shap

# Visualization
import matplotlib.pyplot as plt
import seaborn as sns

# Timing
import time

print("=" * 70)
print("AI-Powered Fraud Detection Pipeline")
print("=" * 70)


# ============================================================================
# 2. LOAD DATA
# ============================================================================
print("\n[1/7] Loading data...")

# --- CHANGE THIS PATH TO YOUR KAGGLE PATH ---
# Kaggle:  "/kaggle/input/train-preprocessed/train_preprocessed.csv"
# Local:   "train_preprocessed.csv"
DATA_PATH = "/kaggle/input/train-preprocessed/train_preprocessed.csv"

train = pd.read_csv(DATA_PATH)
print(f"  Dataset shape: {train.shape}")
print(f"  Fraud distribution:")
print(f"    Not Fraud (0): {(train['isFraud'] == 0).sum():,} ({(train['isFraud'] == 0).mean()*100:.2f}%)")
print(f"    Fraud (1):     {(train['isFraud'] == 1).sum():,} ({(train['isFraud'] == 1).mean()*100:.2f}%)")


# ============================================================================
# 3. TRAIN-TEST SPLIT **BEFORE** SMOTE (Critical Fix)
# ============================================================================
print("\n[2/7] Splitting data (BEFORE SMOTE - no leakage)...")

X = train.drop(columns=['isFraud'])
y = train['isFraud']

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y  # Maintain fraud ratio in both splits
)

print(f"  Train set: {X_train.shape[0]:,} samples")
print(f"    Fraud: {y_train.sum():,} ({y_train.mean()*100:.2f}%)")
print(f"  Test set:  {X_test.shape[0]:,} samples (CLEAN - no SMOTE)")
print(f"    Fraud: {y_test.sum():,} ({y_test.mean()*100:.2f}%)")


# ============================================================================
# 4. APPLY SMOTE **ONLY ON TRAINING DATA**
# ============================================================================
print("\n[3/7] Applying SMOTE on training data only...")

smote = SMOTE(
    sampling_strategy='auto',
    random_state=42,
    k_neighbors=5
)

X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)

print(f"  Before SMOTE: {X_train.shape[0]:,} samples (Fraud: {y_train.sum():,})")
print(f"  After SMOTE:  {X_train_smote.shape[0]:,} samples (Fraud: {y_train_smote.sum():,})")
print(f"  Test set remains UNTOUCHED: {X_test.shape[0]:,} samples")


# ============================================================================
# 5. TRAIN ALL 4 MODELS
# ============================================================================
print("\n[4/7] Training models...")

models = {
    'LightGBM': lgb.LGBMClassifier(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=7,
        num_leaves=31,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbose=-1,
        n_jobs=-1
    ),
    'XGBoost': XGBClassifier(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=7,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss',
        verbosity=0,
        n_jobs=-1
    ),
    'Random Forest': RandomForestClassifier(
        n_estimators=500,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    ),
    'AdaBoost': AdaBoostClassifier(
        n_estimators=300,
        learning_rate=0.1,
        random_state=42,
        algorithm='SAMME'
    )
}

results = {}

for name, model in models.items():
    print(f"\n  Training {name}...")
    start = time.time()

    model.fit(X_train_smote, y_train_smote)

    train_time = time.time() - start

    # Predict on CLEAN test set
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    # Calculate metrics on FRAUD CLASS (class 1)
    results[name] = {
        'model': model,
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred),
        'auc_roc': roc_auc_score(y_test, y_prob),
        'avg_precision': average_precision_score(y_test, y_prob),
        'y_pred': y_pred,
        'y_prob': y_prob,
        'train_time': train_time
    }

    print(f"    Done in {train_time:.1f}s | F1: {results[name]['f1']:.4f} | AUC: {results[name]['auc_roc']:.4f}")


# ============================================================================
# 6. COMPARISON TABLE
# ============================================================================
print("\n[5/7] Model Comparison")
print("=" * 90)
print(f"{'Model':<18} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1-Score':>10} {'AUC-ROC':>10} {'Avg-Prec':>10}")
print("-" * 90)

best_model_name = None
best_f1 = 0

for name, r in results.items():
    print(f"{name:<18} {r['accuracy']:>10.4f} {r['precision']:>10.4f} {r['recall']:>10.4f} {r['f1']:>10.4f} {r['auc_roc']:>10.4f} {r['avg_precision']:>10.4f}")
    if r['f1'] > best_f1:
        best_f1 = r['f1']
        best_model_name = name

print("-" * 90)
print(f"\n  >>> Best Model (by F1): {best_model_name} (F1 = {best_f1:.4f})")


# ============================================================================
# 7. DETAILED CLASSIFICATION REPORTS
# ============================================================================
print("\n[6/7] Detailed Classification Reports")
for name, r in results.items():
    print(f"\n{'='*50}")
    print(f"  {name}")
    print(f"{'='*50}")
    print(classification_report(y_test, r['y_pred'], target_names=['Not Fraud', 'Fraud']))


# ============================================================================
# 8. VISUALIZATIONS
# ============================================================================
print("\n[7/7] Generating visualizations...")

fig, axes = plt.subplots(2, 3, figsize=(20, 12))
fig.suptitle('AI-Powered Fraud Detection - Model Evaluation', fontsize=16, fontweight='bold')

# --- Plot 1: Model Comparison Bar Chart ---
ax = axes[0, 0]
metrics_df = pd.DataFrame({
    name: {
        'Precision': r['precision'],
        'Recall': r['recall'],
        'F1-Score': r['f1'],
        'AUC-ROC': r['auc_roc']
    }
    for name, r in results.items()
}).T
metrics_df.plot(kind='bar', ax=ax, rot=15)
ax.set_title('Model Comparison', fontweight='bold')
ax.set_ylabel('Score')
ax.set_ylim(0, 1.05)
ax.legend(loc='lower right', fontsize=8)
ax.grid(axis='y', alpha=0.3)

# --- Plot 2: ROC Curves ---
ax = axes[0, 1]
for name, r in results.items():
    fpr, tpr, _ = roc_curve(y_test, r['y_prob'])
    ax.plot(fpr, tpr, label=f"{name} (AUC={r['auc_roc']:.3f})", linewidth=2)
ax.plot([0, 1], [0, 1], 'k--', alpha=0.3)
ax.set_title('ROC Curves', fontweight='bold')
ax.set_xlabel('False Positive Rate')
ax.set_ylabel('True Positive Rate')
ax.legend(fontsize=8)
ax.grid(alpha=0.3)

# --- Plot 3: Precision-Recall Curves ---
ax = axes[0, 2]
for name, r in results.items():
    prec, rec, _ = precision_recall_curve(y_test, r['y_prob'])
    ax.plot(rec, prec, label=f"{name} (AP={r['avg_precision']:.3f})", linewidth=2)
ax.set_title('Precision-Recall Curves', fontweight='bold')
ax.set_xlabel('Recall')
ax.set_ylabel('Precision')
ax.legend(fontsize=8)
ax.grid(alpha=0.3)

# --- Plot 4-7: Confusion Matrices for each model ---
for idx, (name, r) in enumerate(results.items()):
    if idx < 2:
        ax = axes[1, idx]
    else:
        break
    cm = confusion_matrix(y_test, r['y_pred'])
    sns.heatmap(cm, annot=True, fmt=',d', cmap='Blues', ax=ax,
                xticklabels=['Not Fraud', 'Fraud'],
                yticklabels=['Not Fraud', 'Fraud'])
    ax.set_title(f'{name} - Confusion Matrix', fontweight='bold')
    ax.set_xlabel('Predicted')
    ax.set_ylabel('Actual')

# --- Plot 6: Training Time Comparison ---
ax = axes[1, 2]
times = {name: r['train_time'] for name, r in results.items()}
bars = ax.bar(times.keys(), times.values(), color=['#2196F3', '#4CAF50', '#FF9800', '#F44336'])
ax.set_title('Training Time (seconds)', fontweight='bold')
ax.set_ylabel('Time (s)')
for bar, t in zip(bars, times.values()):
    ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.5,
            f'{t:.1f}s', ha='center', va='bottom', fontsize=9)
ax.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('model_comparison.png', dpi=150, bbox_inches='tight')
plt.show()
print("  Saved: model_comparison.png")


# ============================================================================
# 9. CONFUSION MATRICES FOR ALL 4 MODELS (separate figure)
# ============================================================================
fig2, axes2 = plt.subplots(1, 4, figsize=(22, 5))
fig2.suptitle('Confusion Matrices - All Models', fontsize=14, fontweight='bold')

for idx, (name, r) in enumerate(results.items()):
    cm = confusion_matrix(y_test, r['y_pred'])
    sns.heatmap(cm, annot=True, fmt=',d', cmap='Blues', ax=axes2[idx],
                xticklabels=['Not Fraud', 'Fraud'],
                yticklabels=['Not Fraud', 'Fraud'])
    axes2[idx].set_title(f'{name}\nF1={r["f1"]:.4f}', fontweight='bold')
    axes2[idx].set_xlabel('Predicted')
    axes2[idx].set_ylabel('Actual')

plt.tight_layout()
plt.savefig('confusion_matrices.png', dpi=150, bbox_inches='tight')
plt.show()
print("  Saved: confusion_matrices.png")


# ============================================================================
# 10. SHAP EXPLAINABILITY (Best Model)
# ============================================================================
print(f"\n{'='*70}")
print(f"SHAP Explainability - {best_model_name}")
print(f"{'='*70}")

best_model = results[best_model_name]['model']

# Use a sample for SHAP (full dataset is too slow)
shap_sample_size = 1000
X_shap = X_test.sample(n=min(shap_sample_size, len(X_test)), random_state=42)

print(f"  Computing SHAP values on {len(X_shap)} test samples...")

# Use TreeExplainer for tree-based models
explainer = shap.TreeExplainer(best_model)
shap_values = explainer.shap_values(X_shap)

# For binary classification, shap_values might be a list [class_0, class_1]
if isinstance(shap_values, list):
    shap_vals = shap_values[1]  # Fraud class
else:
    shap_vals = shap_values

# SHAP Summary Plot (Feature Importance)
print("  Generating SHAP summary plot...")
fig3, ax3 = plt.subplots(figsize=(12, 8))
shap.summary_plot(shap_vals, X_shap, plot_type="bar", max_display=20, show=False)
plt.title(f'SHAP Feature Importance - {best_model_name}', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('shap_feature_importance.png', dpi=150, bbox_inches='tight')
plt.show()
print("  Saved: shap_feature_importance.png")

# SHAP Beeswarm Plot
print("  Generating SHAP beeswarm plot...")
fig4, ax4 = plt.subplots(figsize=(12, 8))
shap.summary_plot(shap_vals, X_shap, max_display=20, show=False)
plt.title(f'SHAP Feature Impact - {best_model_name}', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('shap_beeswarm.png', dpi=150, bbox_inches='tight')
plt.show()
print("  Saved: shap_beeswarm.png")


# ============================================================================
# 11. SINGLE TRANSACTION EXPLANATION (for RPA integration demo)
# ============================================================================
print(f"\n{'='*70}")
print("Sample Fraud Explanation (for RPA Alert System)")
print(f"{'='*70}")

# Find a fraud prediction from test set
fraud_indices = np.where(results[best_model_name]['y_pred'] == 1)[0]
if len(fraud_indices) > 0:
    sample_idx = fraud_indices[0]
    sample = X_test.iloc[[sample_idx]]
    sample_shap = explainer.shap_values(sample)

    if isinstance(sample_shap, list):
        sample_shap_vals = sample_shap[1][0]
    else:
        sample_shap_vals = sample_shap[0]

    prob = results[best_model_name]['y_prob'][sample_idx]

    print(f"\n  Transaction flagged as FRAUD with {prob*100:.1f}% probability")
    print(f"  Top contributing factors:")

    # Get top 5 features
    feature_importance = pd.DataFrame({
        'feature': X_test.columns,
        'shap_value': sample_shap_vals
    }).sort_values('shap_value', key=abs, ascending=False).head(5)

    for _, row in feature_importance.iterrows():
        direction = "increased" if row['shap_value'] > 0 else "decreased"
        print(f"    - {row['feature']}: {direction} fraud risk (SHAP: {row['shap_value']:+.4f})")

    print(f"\n  This explanation would be sent to RPA Bot 1 for:")
    print(f"    -> Customer SMS/Email alert")
    print(f"    -> Case creation in fraud management system")
    print(f"    -> Regulatory reporting (RBI STR)")
else:
    print("  No fraud predictions found in test set sample.")


# ============================================================================
# 12. SAVE RESULTS
# ============================================================================
print(f"\n{'='*70}")
print("Summary & Files Saved")
print(f"{'='*70}")

# Save comparison to CSV
comparison_df = pd.DataFrame({
    name: {
        'Accuracy': r['accuracy'],
        'Precision': r['precision'],
        'Recall': r['recall'],
        'F1-Score': r['f1'],
        'AUC-ROC': r['auc_roc'],
        'Avg Precision': r['avg_precision'],
        'Training Time (s)': r['train_time']
    }
    for name, r in results.items()
}).T.round(4)

comparison_df.to_csv('model_comparison_results.csv')
print(f"\n  model_comparison_results.csv  - Metrics table")
print(f"  model_comparison.png         - Main comparison plots")
print(f"  confusion_matrices.png       - All 4 confusion matrices")
print(f"  shap_feature_importance.png  - SHAP bar plot")
print(f"  shap_beeswarm.png            - SHAP beeswarm plot")

print(f"\n  Best Model: {best_model_name}")
print(f"  F1-Score:   {best_f1:.4f}")
print(f"  AUC-ROC:    {results[best_model_name]['auc_roc']:.4f}")
print(f"  Precision:  {results[best_model_name]['precision']:.4f}")
print(f"  Recall:     {results[best_model_name]['recall']:.4f}")

print(f"\n{'='*70}")
print("Pipeline complete! Copy this into your Kaggle notebook.")
print(f"{'='*70}")

#get best model

import joblib
import pickle

# Get the best model
best_model = results[best_model_name]['model']
print(f"Saving {best_model_name}...")

# Method 1: joblib (recommended for sklearn-compatible models)
joblib.dump(best_model, 'fraud_detection_xgboost.pkl')
print("Saved: fraud_detection_xgboost.pkl")

# Method 2: XGBoost native format (smaller, portable)
best_model.save_model('fraud_detection_xgboost.json')
print("Saved: fraud_detection_xgboost.json")

# Also save the feature names (important for later inference!)
feature_names = X_train.columns.tolist()
with open('feature_names.pkl', 'wb') as f:
    pickle.dump(feature_names, f)
print("Saved: feature_names.pkl")