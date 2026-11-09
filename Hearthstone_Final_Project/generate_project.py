"""
Hearthstone Final Project — BUAN/ITSS 4382
Complete analysis script: generates all charts, model results, and notebook.
Run this script from the Hearthstone_Final_Project directory.
"""

import os
import json
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score, roc_curve
)
from sklearn.inspection import permutation_importance

warnings.filterwarnings('ignore')
CHARTS = 'charts'
os.makedirs(CHARTS, exist_ok=True)

# ── Plotting style ──────────────────────────────────────────────────────────
plt.rcParams.update({
    'figure.facecolor': 'white',
    'axes.facecolor':   '#f8f8f8',
    'axes.grid':        True,
    'grid.alpha':       0.4,
    'font.size':        11,
    'axes.titlesize':   13,
    'axes.labelsize':   11,
})
PALETTE = ['#2196F3', '#FF5722']
sns.set_palette(PALETTE)

# ════════════════════════════════════════════════════════════════════════════
# 1. LOAD DATA
# ════════════════════════════════════════════════════════════════════════════
df = pd.read_csv('R-HEARTHSTONE.csv')

print("=" * 60)
print("DATASET DIMENSIONS:", df.shape)
print("COLUMNS:", df.columns.tolist())
print(df.dtypes)
print("\nFIRST 5 ROWS:")
print(df.head())
print("\nLAST 5 ROWS:")
print(df.tail())
print("\nMISSING VALUES:")
print(df.isnull().sum())
print("\nDUPLICATED ROWS:", df.duplicated().sum())
print("DUPLICATED ORDER IDs:", df['order_id'].duplicated().sum())
print("\nNUMERICAL SUMMARY:")
print(df.describe())
print("\nCATEGORICAL DISTRIBUTIONS:")
for col in ['product_category','product_subcategory','supplier_location',
            'warehouse_location','shipping_method','assembly_required',
            'product_damaged','customer_return','return_reason']:
    print(f"\n{col}:")
    print(df[col].value_counts(dropna=False))

# ════════════════════════════════════════════════════════════════════════════
# 2. DATA CLEANING AND PREPROCESSING
# ════════════════════════════════════════════════════════════════════════════
df['order_date'] = pd.to_datetime(df['order_date'])

# Binary encode Yes/No columns
for col in ['assembly_required', 'product_damaged', 'customer_return']:
    df[col + '_bin'] = (df[col].str.strip() == 'Yes').astype(int)

# Keep originals too
df['target'] = df['customer_return_bin']

# Investigate return_reason NaN (expected: non-returned orders)
print("\nReturn reason NaN when no return:")
print(pd.crosstab(df['customer_return'], df['return_reason'].isna()))

# Date features
df['order_month'] = df['order_date'].dt.month
df['order_quarter'] = df['order_date'].dt.quarter

TARGET_VARIABLE = 'target'
RETURN_RATE = df[TARGET_VARIABLE].mean()
print(f"\nOVERALL RETURN RATE: {RETURN_RATE:.2%}")

# ════════════════════════════════════════════════════════════════════════════
# 3. EDA — ANALYSIS A: OVERALL RETURN RATE
# ════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(7, 5))
counts = df['customer_return'].value_counts()
bars = ax.bar(counts.index, counts.values, color=PALETTE, edgecolor='white', linewidth=1.5)
for bar, val in zip(bars, counts.values):
    pct = val / len(df) * 100
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 60,
            f'{val:,}\n({pct:.1f}%)', ha='center', va='bottom', fontweight='bold')
ax.set_title('Hearthstone — Customer Return vs. No Return', fontsize=14, fontweight='bold')
ax.set_xlabel('Customer Return Status')
ax.set_ylabel('Number of Orders')
ax.set_ylim(0, counts.max() * 1.2)
plt.tight_layout()
plt.savefig(f'{CHARTS}/A_return_rate.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved A_return_rate.png")

# ════════════════════════════════════════════════════════════════════════════
# 4. EDA — ANALYSIS B: PRODUCT DAMAGE VS RETURNS
# ════════════════════════════════════════════════════════════════════════════
damage_return = df.groupby('product_damaged')['target'].agg(['mean','count']).reset_index()
damage_return.columns = ['product_damaged','return_rate','count']
damage_return['return_rate_pct'] = damage_return['return_rate'] * 100

fig, axes = plt.subplots(1, 2, figsize=(12, 5))
# Left: return rate
colors = ['#4CAF50', '#F44336']
bars = axes[0].bar(damage_return['product_damaged'], damage_return['return_rate_pct'],
                   color=colors, edgecolor='white', linewidth=1.5)
for bar, val in zip(bars, damage_return['return_rate_pct']):
    axes[0].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
                 f'{val:.1f}%', ha='center', fontweight='bold')
axes[0].set_title('Return Rate by Product Damage Status', fontweight='bold')
axes[0].set_xlabel('Product Damaged')
axes[0].set_ylabel('Return Rate (%)')
axes[0].set_ylim(0, damage_return['return_rate_pct'].max() * 1.25)
# Right: count
axes[1].bar(damage_return['product_damaged'], damage_return['count'],
            color=colors, edgecolor='white', linewidth=1.5)
axes[1].set_title('Sample Size by Damage Status', fontweight='bold')
axes[1].set_xlabel('Product Damaged')
axes[1].set_ylabel('Number of Orders')
plt.tight_layout()
plt.savefig(f'{CHARTS}/B_damage_vs_return.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved B_damage_vs_return.png")

print("\nProduct Damage Return Rates:")
print(damage_return)

# ════════════════════════════════════════════════════════════════════════════
# 5. EDA — ANALYSIS C: FULFILLMENT TIME VS RETURNS
# ════════════════════════════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 2, figsize=(13, 5))
# Boxplot
df.boxplot(column='fulfillment_lead_time_days', by='customer_return',
           ax=axes[0], patch_artist=True,
           boxprops=dict(facecolor='#90CAF9'),
           medianprops=dict(color='red', linewidth=2))
axes[0].set_title('Fulfillment Lead Time by Return Status', fontweight='bold')
axes[0].set_xlabel('Customer Return')
axes[0].set_ylabel('Fulfillment Lead Time (days)')
plt.sca(axes[0])
plt.title('Fulfillment Lead Time by Return Status')

# Binned analysis
df['lead_time_group'] = pd.cut(df['fulfillment_lead_time_days'],
                               bins=[0, 7, 14, 21, 60],
                               labels=['0-7 days','8-14 days','15-21 days','22+ days'])
lt_ret = df.groupby('lead_time_group', observed=True)['target'].agg(['mean','count']).reset_index()
lt_ret['return_rate_pct'] = lt_ret['mean'] * 100
axes[1].bar(lt_ret['lead_time_group'].astype(str), lt_ret['return_rate_pct'],
            color='#42A5F5', edgecolor='white', linewidth=1.5)
for i, (rate, cnt) in enumerate(zip(lt_ret['return_rate_pct'], lt_ret['count'])):
    axes[1].text(i, rate + 0.3, f'{rate:.1f}%\n(n={cnt:,})', ha='center', fontsize=9)
axes[1].set_title('Return Rate by Fulfillment Lead Time Group', fontweight='bold')
axes[1].set_xlabel('Lead Time Group')
axes[1].set_ylabel('Return Rate (%)')
axes[1].set_ylim(0, lt_ret['return_rate_pct'].max() * 1.3)
plt.tight_layout()
plt.savefig(f'{CHARTS}/C_fulfillment_vs_return.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved C_fulfillment_vs_return.png")

lt_summary = df.groupby('customer_return')['fulfillment_lead_time_days'].describe()
print("\nFulfillment Lead Time Summary by Return Status:")
print(lt_summary)

# ════════════════════════════════════════════════════════════════════════════
# 6. EDA — ANALYSIS D: PRODUCT CATEGORIES
# ════════════════════════════════════════════════════════════════════════════
cat_ret = (df.groupby('product_category')['target']
             .agg(['mean','count'])
             .reset_index()
             .rename(columns={'mean':'return_rate','count':'n_orders'}))
cat_ret['return_rate_pct'] = cat_ret['return_rate'] * 100
cat_ret = cat_ret.sort_values('return_rate_pct', ascending=False)

fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.barh(cat_ret['product_category'], cat_ret['return_rate_pct'],
               color='#5C6BC0', edgecolor='white')
for bar, (_, row) in zip(bars, cat_ret.iterrows()):
    ax.text(bar.get_width() + 0.2, bar.get_y() + bar.get_height()/2,
            f'{row["return_rate_pct"]:.1f}% (n={row["n_orders"]:,})',
            va='center', fontsize=10)
ax.set_title('Return Rate by Product Category', fontweight='bold', fontsize=14)
ax.set_xlabel('Return Rate (%)')
ax.set_xlim(0, cat_ret['return_rate_pct'].max() * 1.4)
plt.tight_layout()
plt.savefig(f'{CHARTS}/D_category_return_rate.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved D_category_return_rate.png")

# Subcategory
subcat_ret = (df.groupby(['product_category','product_subcategory'])['target']
                .agg(['mean','count'])
                .reset_index()
                .rename(columns={'mean':'return_rate','count':'n_orders'}))
subcat_ret['return_rate_pct'] = subcat_ret['return_rate'] * 100
subcat_ret = subcat_ret[subcat_ret['n_orders'] >= 50].sort_values('return_rate_pct', ascending=False).head(15)

fig, ax = plt.subplots(figsize=(11, 7))
bars = ax.barh(subcat_ret['product_subcategory'], subcat_ret['return_rate_pct'],
               color='#7E57C2', edgecolor='white')
for bar, (_, row) in zip(bars, subcat_ret.iterrows()):
    ax.text(bar.get_width() + 0.2, bar.get_y() + bar.get_height()/2,
            f'{row["return_rate_pct"]:.1f}% (n={row["n_orders"]:,})',
            va='center', fontsize=9)
ax.set_title('Top 15 Subcategories by Return Rate (min 50 orders)', fontweight='bold', fontsize=13)
ax.set_xlabel('Return Rate (%)')
ax.set_xlim(0, subcat_ret['return_rate_pct'].max() * 1.4)
plt.tight_layout()
plt.savefig(f'{CHARTS}/D_subcategory_return_rate.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved D_subcategory_return_rate.png")
print("\nReturn Rate by Category:")
print(cat_ret)

# ════════════════════════════════════════════════════════════════════════════
# 7. EDA — ANALYSIS E: SHIPPING METHODS
# ════════════════════════════════════════════════════════════════════════════
ship_ret = (df.groupby('shipping_method')['target']
              .agg(['mean','count'])
              .reset_index()
              .rename(columns={'mean':'return_rate','count':'n_orders'}))
ship_ret['return_rate_pct'] = ship_ret['return_rate'] * 100
ship_ret = ship_ret.sort_values('return_rate_pct', ascending=False)

fig, ax = plt.subplots(figsize=(9, 5))
bars = ax.bar(ship_ret['shipping_method'], ship_ret['return_rate_pct'],
              color='#26A69A', edgecolor='white', linewidth=1.5)
for bar, (_, row) in zip(bars, ship_ret.iterrows()):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
            f'{row["return_rate_pct"]:.1f}%\n(n={row["n_orders"]:,})',
            ha='center', fontsize=10)
ax.set_title('Return Rate by Shipping Method', fontweight='bold', fontsize=14)
ax.set_xlabel('Shipping Method')
ax.set_ylabel('Return Rate (%)')
ax.set_ylim(0, ship_ret['return_rate_pct'].max() * 1.3)
plt.tight_layout()
plt.savefig(f'{CHARTS}/E_shipping_return_rate.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved E_shipping_return_rate.png")
print("\nReturn Rate by Shipping Method:")
print(ship_ret)

# ════════════════════════════════════════════════════════════════════════════
# 8. EDA — ANALYSIS F: ASSEMBLY REQUIREMENTS
# ════════════════════════════════════════════════════════════════════════════
asm_ret = (df.groupby('assembly_required')['target']
             .agg(['mean','count'])
             .reset_index()
             .rename(columns={'mean':'return_rate','count':'n_orders'}))
asm_ret['return_rate_pct'] = asm_ret['return_rate'] * 100

fig, ax = plt.subplots(figsize=(7, 5))
bars = ax.bar(asm_ret['assembly_required'], asm_ret['return_rate_pct'],
              color=['#66BB6A','#EF5350'], edgecolor='white', linewidth=1.5)
for bar, (_, row) in zip(bars, asm_ret.iterrows()):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
            f'{row["return_rate_pct"]:.1f}%\n(n={row["n_orders"]:,})',
            ha='center', fontweight='bold')
ax.set_title('Return Rate by Assembly Requirement', fontweight='bold', fontsize=14)
ax.set_xlabel('Assembly Required')
ax.set_ylabel('Return Rate (%)')
ax.set_ylim(0, asm_ret['return_rate_pct'].max() * 1.3)
plt.tight_layout()
plt.savefig(f'{CHARTS}/F_assembly_return_rate.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved F_assembly_return_rate.png")
print("\nReturn Rate by Assembly Requirement:")
print(asm_ret)

# ════════════════════════════════════════════════════════════════════════════
# 9. EDA — ANALYSIS G: PRICE AND SHIPPING COST
# ════════════════════════════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 2, figsize=(13, 5))
# Price
df.boxplot(column='product_price_usd', by='customer_return', ax=axes[0], patch_artist=True,
           boxprops=dict(facecolor='#FFB74D'),
           medianprops=dict(color='darkred', linewidth=2))
axes[0].set_title('Product Price by Return Status', fontweight='bold')
axes[0].set_xlabel('Customer Return')
axes[0].set_ylabel('Product Price (USD)')
plt.sca(axes[0])
plt.title('Product Price by Return Status')

# Shipping cost
df.boxplot(column='shipping_cost_usd', by='customer_return', ax=axes[1], patch_artist=True,
           boxprops=dict(facecolor='#80DEEA'),
           medianprops=dict(color='darkblue', linewidth=2))
axes[1].set_title('Shipping Cost by Return Status', fontweight='bold')
axes[1].set_xlabel('Customer Return')
axes[1].set_ylabel('Shipping Cost (USD)')
plt.sca(axes[1])
plt.title('Shipping Cost by Return Status')

plt.tight_layout()
plt.savefig(f'{CHARTS}/G_price_shipping_return.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved G_price_shipping_return.png")

price_summary = df.groupby('customer_return')[['product_price_usd','shipping_cost_usd']].describe()
print("\nPrice & Shipping Cost by Return Status:")
print(price_summary)

# ════════════════════════════════════════════════════════════════════════════
# 10. EDA — ANALYSIS H: RETURN REASONS
# ════════════════════════════════════════════════════════════════════════════
returned_df = df[df['target'] == 1].copy()
valid_reasons = returned_df[~returned_df['return_reason'].isin(['N/A', None, '']) &
                             returned_df['return_reason'].notna()]
reason_counts = valid_reasons['return_reason'].value_counts()

fig, ax = plt.subplots(figsize=(9, 6))
bars = ax.barh(reason_counts.index, reason_counts.values, color='#AB47BC', edgecolor='white')
for bar, val in zip(bars, reason_counts.values):
    pct = val / len(returned_df) * 100
    ax.text(bar.get_width() + 5, bar.get_y() + bar.get_height()/2,
            f'{val:,} ({pct:.1f}%)', va='center', fontsize=10)
ax.set_title('Most Common Return Reasons\n(Returned Orders Only)', fontweight='bold', fontsize=13)
ax.set_xlabel('Number of Returns')
ax.set_xlim(0, reason_counts.max() * 1.35)
plt.tight_layout()
plt.savefig(f'{CHARTS}/H_return_reasons.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved H_return_reasons.png")
print("\nReturn Reasons (returned orders only):")
print(reason_counts)

# ════════════════════════════════════════════════════════════════════════════
# 11. FEATURE ENGINEERING
# ════════════════════════════════════════════════════════════════════════════
df['price_band'] = pd.cut(df['product_price_usd'],
                          bins=[0, 100, 300, 600, 1000, 10000],
                          labels=['<$100','$100-$300','$300-$600','$600-$1000','>$1000'])
df['shipping_pct_of_order'] = df['shipping_cost_usd'] / df['order_value_usd'].replace(0, np.nan)
df['weight_group'] = pd.cut(df['product_weight_lbs'],
                            bins=[0, 20, 50, 100, 500],
                            labels=['Light (<20 lbs)','Medium (20-50)','Heavy (50-100)','Very Heavy (100+)'])
df['lead_time_category'] = pd.cut(df['fulfillment_lead_time_days'],
                                  bins=[0, 7, 14, 21, 60],
                                  labels=['Fast (0-7)','Standard (8-14)','Slow (15-21)','Very Slow (22+)'])

# Price band return rate chart
pb_ret = (df.groupby('price_band', observed=True)['target']
            .agg(['mean','count'])
            .reset_index()
            .rename(columns={'mean':'return_rate','count':'n_orders'}))
pb_ret['return_rate_pct'] = pb_ret['return_rate'] * 100

fig, ax = plt.subplots(figsize=(9, 5))
bars = ax.bar(pb_ret['price_band'].astype(str), pb_ret['return_rate_pct'],
              color='#FF7043', edgecolor='white', linewidth=1.5)
for bar, (_, row) in zip(bars, pb_ret.iterrows()):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.2,
            f'{row["return_rate_pct"]:.1f}%\n(n={row["n_orders"]:,})',
            ha='center', fontsize=9)
ax.set_title('Return Rate by Product Price Band (Engineered Feature)', fontweight='bold', fontsize=13)
ax.set_xlabel('Price Band')
ax.set_ylabel('Return Rate (%)')
ax.set_ylim(0, pb_ret['return_rate_pct'].max() * 1.3)
plt.tight_layout()
plt.savefig(f'{CHARTS}/FE_price_band_return.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved FE_price_band_return.png")

# ════════════════════════════════════════════════════════════════════════════
# 12. MODEL BUILDING
# ════════════════════════════════════════════════════════════════════════════
# Feature sets (pre-shipment features — no post-delivery leakage)
# Excluded: return_reason (reveals target), restocking_fee_usd (post-return),
#           customer_rating (post-experience)

FEATURES = [
    'product_price_usd', 'product_weight_lbs', 'product_dimensions_cuft',
    'fulfillment_lead_time_days', 'assembly_required_bin', 'product_damaged_bin',
    'order_month', 'order_quarter',
    'product_category', 'product_subcategory', 'supplier_location',
    'warehouse_location', 'customer_state', 'shipping_method',
]

X = df[FEATURES].copy()
y = df[TARGET_VARIABLE].copy()

# Encode categoricals
cat_cols = X.select_dtypes(include='object').columns.tolist()
num_cols = X.select_dtypes(include=['int64','float64']).columns.tolist()

print(f"\nCategorical features: {cat_cols}")
print(f"Numerical features: {num_cols}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTraining set: {X_train.shape[0]} rows | Test set: {X_test.shape[0]} rows")
print(f"Training target distribution:\n{y_train.value_counts(normalize=True)}")
print(f"Test target distribution:\n{y_test.value_counts(normalize=True)}")

# Preprocessing pipeline
preprocessor = ColumnTransformer(transformers=[
    ('num', 'passthrough', num_cols),
    ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
])

# ── Model 0: Dummy Baseline ──────────────────────────────────────────────
dummy_pipe = Pipeline([('pre', preprocessor), ('clf', DummyClassifier(strategy='most_frequent', random_state=42))])
dummy_pipe.fit(X_train, y_train)
dummy_pred = dummy_pipe.predict(X_test)

# ── Model 1: Decision Tree ───────────────────────────────────────────────
dt_pipe = Pipeline([('pre', preprocessor), ('clf', DecisionTreeClassifier(max_depth=5, random_state=42))])
dt_pipe.fit(X_train, y_train)
dt_pred = dt_pipe.predict(X_test)
dt_prob = dt_pipe.predict_proba(X_test)[:, 1]

# ── Model 2: Random Forest ───────────────────────────────────────────────
rf_pipe = Pipeline([('pre', preprocessor), ('clf', RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, n_jobs=-1))])
rf_pipe.fit(X_train, y_train)
rf_pred = rf_pipe.predict(X_test)
rf_prob = rf_pipe.predict_proba(X_test)[:, 1]

# ── Model 3: Logistic Regression ─────────────────────────────────────────
lr_preprocessor = ColumnTransformer(transformers=[
    ('num', StandardScaler(), num_cols),
    ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols),
])
lr_pipe = Pipeline([('pre', lr_preprocessor), ('clf', LogisticRegression(max_iter=1000, random_state=42))])
lr_pipe.fit(X_train, y_train)
lr_pred = lr_pipe.predict(X_test)
lr_prob = lr_pipe.predict_proba(X_test)[:, 1]

# ════════════════════════════════════════════════════════════════════════════
# 13. MODEL EVALUATION
# ════════════════════════════════════════════════════════════════════════════
def eval_model(name, pipe, X_tr, X_te, y_tr, y_te, pred, prob=None):
    train_acc = pipe.score(X_tr, y_tr)
    test_acc  = accuracy_score(y_te, pred)
    prec = precision_score(y_te, pred, zero_division=0)
    rec  = recall_score(y_te, pred, zero_division=0)
    f1   = f1_score(y_te, pred, zero_division=0)
    auc  = roc_auc_score(y_te, prob) if prob is not None else np.nan
    cm   = confusion_matrix(y_te, pred)
    report = classification_report(y_te, pred, target_names=['Not Returned','Returned'])
    print(f"\n{'='*60}")
    print(f"MODEL: {name}")
    print(f"  Train Accuracy : {train_acc:.4f}")
    print(f"  Test  Accuracy : {test_acc:.4f}")
    print(f"  Precision      : {prec:.4f}")
    print(f"  Recall         : {rec:.4f}")
    print(f"  F1-Score       : {f1:.4f}")
    print(f"  ROC-AUC        : {auc:.4f}" if prob is not None else "  ROC-AUC: N/A")
    print(f"  Confusion Matrix:\n{cm}")
    print(f"  Classification Report:\n{report}")
    return {
        'Model': name,
        'Train Acc': round(train_acc, 4),
        'Test Acc': round(test_acc, 4),
        'Precision': round(prec, 4),
        'Recall': round(rec, 4),
        'F1': round(f1, 4),
        'ROC-AUC': round(auc, 4) if prob is not None else np.nan,
        'CM': cm,
    }

results = []
results.append(eval_model('Dummy Baseline', dummy_pipe, X_train, X_test, y_train, y_test, dummy_pred))
results.append(eval_model('Decision Tree (depth=5)', dt_pipe, X_train, X_test, y_train, y_test, dt_pred, dt_prob))
results.append(eval_model('Random Forest', rf_pipe, X_train, X_test, y_train, y_test, rf_pred, rf_prob))
results.append(eval_model('Logistic Regression', lr_pipe, X_train, X_test, y_train, y_test, lr_pred, lr_prob))

results_df = pd.DataFrame([{k: v for k, v in r.items() if k != 'CM'} for r in results])
print("\n\nMODEL COMPARISON TABLE:")
print(results_df.to_string(index=False))

# ── Comparison bar chart ─────────────────────────────────────────────────
metrics = ['Test Acc','Precision','Recall','F1','ROC-AUC']
x = np.arange(len(metrics))
width = 0.2
model_names = results_df['Model'].tolist()
colors_m = ['#9E9E9E','#2196F3','#4CAF50','#FF9800']

fig, ax = plt.subplots(figsize=(13, 6))
for i, (name, color) in enumerate(zip(model_names, colors_m)):
    vals = [results_df.loc[results_df['Model']==name, m].values[0] for m in metrics]
    rects = ax.bar(x + i * width, vals, width, label=name, color=color, edgecolor='white')
    for rect in rects:
        h = rect.get_height()
        if not np.isnan(h):
            ax.text(rect.get_x() + rect.get_width()/2, h + 0.005,
                    f'{h:.2f}', ha='center', va='bottom', fontsize=8)
ax.set_xlabel('Metric')
ax.set_ylabel('Score')
ax.set_title('Model Performance Comparison', fontweight='bold', fontsize=14)
ax.set_xticks(x + width * 1.5)
ax.set_xticklabels(metrics)
ax.set_ylim(0, 1.15)
ax.legend(loc='upper right', fontsize=9)
plt.tight_layout()
plt.savefig(f'{CHARTS}/MODEL_comparison.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved MODEL_comparison.png")

# ── Confusion matrices ───────────────────────────────────────────────────
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes = axes.flatten()
model_labels = ['Dummy Baseline','Decision Tree','Random Forest','Logistic Regression']
all_preds = [dummy_pred, dt_pred, rf_pred, lr_pred]
for i, (name, pred) in enumerate(zip(model_labels, all_preds)):
    cm = confusion_matrix(y_test, pred)
    sns.heatmap(cm, annot=True, fmt='d', ax=axes[i],
                cmap='Blues', cbar=False,
                xticklabels=['Predicted 0','Predicted 1'],
                yticklabels=['Actual 0','Actual 1'])
    axes[i].set_title(f'{name}', fontweight='bold')
plt.suptitle('Confusion Matrices — All Models', fontsize=14, fontweight='bold', y=1.01)
plt.tight_layout()
plt.savefig(f'{CHARTS}/MODEL_confusion_matrices.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved MODEL_confusion_matrices.png")

# ── ROC curves ───────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(8, 6))
for name, prob, color in [
    ('Decision Tree', dt_prob, '#2196F3'),
    ('Random Forest', rf_prob, '#4CAF50'),
    ('Logistic Regression', lr_prob, '#FF9800'),
]:
    fpr, tpr, _ = roc_curve(y_test, prob)
    auc_val = roc_auc_score(y_test, prob)
    ax.plot(fpr, tpr, label=f'{name} (AUC={auc_val:.3f})', color=color, linewidth=2)
ax.plot([0,1],[0,1],'--', color='gray', label='Random Baseline')
ax.set_xlabel('False Positive Rate')
ax.set_ylabel('True Positive Rate')
ax.set_title('ROC Curves — Model Comparison', fontweight='bold', fontsize=14)
ax.legend(loc='lower right')
plt.tight_layout()
plt.savefig(f'{CHARTS}/MODEL_roc_curves.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved MODEL_roc_curves.png")

# ════════════════════════════════════════════════════════════════════════════
# 14. FEATURE IMPORTANCE
# ════════════════════════════════════════════════════════════════════════════
# Get feature names after encoding
ohe = rf_pipe.named_steps['pre'].named_transformers_['cat']
ohe_features = ohe.get_feature_names_out(cat_cols).tolist()
all_feature_names = num_cols + ohe_features

rf_clf = rf_pipe.named_steps['clf']
importances = pd.Series(rf_clf.feature_importances_, index=all_feature_names)
importances = importances.sort_values(ascending=False).head(20)

fig, ax = plt.subplots(figsize=(10, 7))
bars = ax.barh(importances.index[::-1], importances.values[::-1], color='#5C6BC0', edgecolor='white')
ax.set_title('Top 20 Feature Importances — Random Forest', fontweight='bold', fontsize=14)
ax.set_xlabel('Feature Importance (Mean Decrease in Impurity)')
plt.tight_layout()
plt.savefig(f'{CHARTS}/FEAT_importance_rf.png', dpi=150, bbox_inches='tight')
plt.close()
print("Saved FEAT_importance_rf.png")
print("\nTop 20 Feature Importances (Random Forest):")
print(importances)

# ── Cross-validation for best model ─────────────────────────────────────
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
rf_cv_scores = cross_val_score(rf_pipe, X, y, cv=cv, scoring='roc_auc')
print(f"\nRandom Forest 5-Fold CV ROC-AUC: {rf_cv_scores.mean():.4f} ± {rf_cv_scores.std():.4f}")

dt_cv_scores = cross_val_score(dt_pipe, X, y, cv=cv, scoring='roc_auc')
print(f"Decision Tree 5-Fold CV ROC-AUC: {dt_cv_scores.mean():.4f} ± {dt_cv_scores.std():.4f}")

# ════════════════════════════════════════════════════════════════════════════
# 15. BUSINESS IMPACT ESTIMATION
# ════════════════════════════════════════════════════════════════════════════
total_orders = len(df)
total_returns = df['target'].sum()
avg_order_value = df['order_value_usd'].mean()
avg_restocking_fee = df['restocking_fee_usd'].mean()

print(f"\n{'='*60}")
print("BUSINESS IMPACT ESTIMATION")
print(f"Total Orders: {total_orders:,}")
print(f"Total Returns: {total_returns:,}")
print(f"Return Rate: {total_returns/total_orders:.2%}")
print(f"Avg Order Value: ${avg_order_value:.2f}")
print(f"Avg Restocking Fee: ${avg_restocking_fee:.2f}")

for reduction_pct in [5, 10, 15]:
    avoided_returns = int(total_returns * reduction_pct / 100)
    # Restocking fee recovered + operational savings estimate ($50/return)
    saved_restocking = avoided_returns * avg_restocking_fee
    saved_operations = avoided_returns * 50  # conservative estimate
    total_savings = saved_restocking + saved_operations
    print(f"\n{reduction_pct}% Return Rate Reduction Scenario:")
    print(f"  Avoided Returns: {avoided_returns:,}")
    print(f"  Recovered Restocking Fees: ${saved_restocking:,.0f}")
    print(f"  Est. Operational Savings (@$50/return): ${saved_operations:,.0f}")
    print(f"  Total Estimated Annual Savings: ${total_savings:,.0f}")

# ════════════════════════════════════════════════════════════════════════════
# 16. SAVE RESULTS FOR NOTEBOOK INTEGRATION
# ════════════════════════════════════════════════════════════════════════════
results_df.to_csv('model_results.csv', index=False)
importances.to_csv('feature_importances.csv')
print("\n\nAll charts saved to charts/ directory.")
print("model_results.csv and feature_importances.csv saved.")
print("Script complete!")
