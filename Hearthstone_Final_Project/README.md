# Hearthstone Final Project
## BUAN/ITSS 4382 — Applied AI/ML | University of Texas at Dallas

### Project Title
**Predicting and Reducing Product Returns at Hearthstone Using Machine Learning**

---

## Project Overview

This project investigates product return patterns at **Hearthstone**, an online furniture and
home décor marketplace. Using a dataset of 10,000 orders, we applied exploratory data analysis,
feature engineering, and machine learning classification models to identify the key drivers of
returns and develop evidence-based business recommendations.

**Return rate: 36.7%** — significantly above the ~20–25% furniture e-commerce industry average.

---

## Repository Structure

```
Hearthstone_Final_Project/
├── Hearthstone_Final_Project.ipynb    ← Main Jupyter notebook (complete analysis)
├── Hearthstone_Project_Plan.docx      ← Project plan Word document
├── Hearthstone_Final_Presentation.pptx ← 13-slide PowerPoint presentation
├── R-HEARTHSTONE.csv                  ← Dataset (original, unchanged)
├── README.md                          ← This file
├── Rubric_Checklist.md                ← Assignment rubric mapping
├── requirements.txt                   ← Python dependencies
├── generate_project.py                ← Script to regenerate all charts and results
├── create_notebook.py                 ← Script to recreate the .ipynb file
├── create_docx.py                     ← Script to recreate the Word document
├── create_pptx.py                     ← Script to recreate the PowerPoint
├── model_results.csv                  ← Model performance table
├── feature_importances.csv            ← Feature importance scores
└── charts/                            ← All presentation-ready visualizations
    ├── A_return_rate.png
    ├── B_damage_vs_return.png
    ├── C_fulfillment_vs_return.png
    ├── D_category_return_rate.png
    ├── D_subcategory_return_rate.png
    ├── E_shipping_return_rate.png
    ├── F_assembly_return_rate.png
    ├── G_price_shipping_return.png
    ├── H_return_reasons.png
    ├── FE_price_band_return.png
    ├── MODEL_comparison.png
    ├── MODEL_confusion_matrices.png
    ├── MODEL_roc_curves.png
    └── FEAT_importance_rf.png
```

---

## How to Run the Project

### Prerequisites

**Python 3.8+** is required. Install all dependencies:

```bash
pip install -r requirements.txt
```

### Option 1: Run the Jupyter Notebook (Recommended)

```bash
cd Hearthstone_Final_Project
jupyter notebook Hearthstone_Final_Project.ipynb
```

The notebook is organized into 12 clearly labeled sections with markdown explanations.
Run all cells from top to bottom — the notebook is fully reproducible.

### Option 2: Run the Analysis Script

This script regenerates all charts and prints all results to the console:

```bash
cd Hearthstone_Final_Project
python3 generate_project.py
```

### Option 3: Recreate All Deliverables from Scratch

```bash
cd Hearthstone_Final_Project
python3 generate_project.py        # Regenerate charts and CSVs
python3 create_notebook.py         # Recreate .ipynb
python3 create_docx.py             # Recreate Word document
python3 create_pptx.py             # Recreate PowerPoint
jupyter nbconvert --to notebook --execute --inplace Hearthstone_Final_Project.ipynb
```

---

## Key Findings

| Finding | Value |
|---|---|
| Overall return rate | **36.7%** |
| Furniture category return rate | **55.6%** |
| Damaged product return rate | **71.7%** |
| Assembly-required return rate | **54.6%** |
| White Glove shipping return rate | **52.1%** |
| Average fulfillment (returned) | **23.5 days** |
| Average fulfillment (not returned) | **18.8 days** |
| Returned orders avg price | **$913.92** |
| Non-returned orders avg price | **$565.10** |

## Machine Learning Results

| Model | Test Accuracy | F1 (Returns) | ROC-AUC |
|---|---|---|---|
| Dummy Baseline | 63.3% | 0.00 | N/A |
| Decision Tree (depth=5) | 69.8% | 0.54 | 0.719 |
| Random Forest (200 trees) | 70.2% | 0.55 | 0.733 |
| Logistic Regression | 70.4% | 0.54 | **0.737** |

All models use 80/20 stratified split, `random_state=42`, validated with 5-fold cross-validation.

---

## Top Recommendations

1. **Immediate**: Improve packaging and damage prevention (71.7% of damaged items are returned)
2. **Immediate**: Address Furniture category (55.6% return rate) — video assembly guides, better photos
3. **Short-term**: Reduce fulfillment lead times for high-risk orders
4. **Short-term**: Deploy ML return-risk scoring at checkout (flag orders for quality checks)
5. **Medium-term**: Improve product page content to reduce "Changed Mind" returns (21%)

---

## Data Notes

- Dataset: `R-HEARTHSTONE.csv` — 10,000 rows × 20 columns
- `return_reason` has 6,334 NaN values — **expected behavior** (non-returned orders have no reason)
- `restocking_fee_usd` and `customer_rating` excluded from models to prevent data leakage
- Original dataset file left unchanged

---

## Course Information

- **Course**: BUAN/ITSS 4382 — Applied AI/ML
- **Institution**: University of Texas at Dallas
- **Due Date**: November 17, 2026
- **Project Type**: Group Final Project (20% of course grade)
