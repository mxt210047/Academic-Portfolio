# Rubric Checklist
## BUAN/ITSS 4382 Final Project — Hearthstone

This document maps every assignment requirement to its location in our deliverables.

---

## Project Plan Requirements (Section 2.1 of Assignment)

| Requirement | Status | Location |
|---|---|---|
| 1. Selected company and dataset | ✅ Complete | `Hearthstone_Project_Plan.docx` Section 1; Notebook Introduction |
| 2. Business problem (specific and measurable) | ✅ Complete | Docx Section 2; Notebook Section 3; Presentation Slide 4 |
| 3. Target variable identified | ✅ Complete | Docx Section 3; Notebook Section 3; `customer_return` |
| 4. Three to five exploratory questions | ✅ Complete (5 questions) | Docx Section 4; Notebook EDA (8 analyses) |
| 5. Planned AI/ML method and justification | ✅ Complete | Docx Section 5; Notebook Section 6; Presentation Slide 7 |
| 6. Expected business recommendation area | ✅ Complete | Docx Section 6; Notebook Section 10 |

---

## Python Notebook Requirements (Section 2.2 of Assignment)

| Notebook Section | Requirement | Status | Location |
|---|---|---|---|
| 1 | Introduction and business problem | ✅ | Notebook Section 1 (markdown) |
| 2 | Data import | ✅ | Notebook Section 1 (code) |
| 3 | Data inspection and understanding | ✅ | Notebook Section 2 |
| 4 | Data cleaning and preparation | ✅ | Notebook Section 3 |
| 5 | Exploratory data analysis | ✅ | Notebook Section 4 (Analyses A–H) |
| 6 | Feature engineering or variable selection | ✅ | Notebook Section 5 |
| 7 | Model building or analytical method | ✅ | Notebook Section 6 (4 models) |
| 8 | Model evaluation or analytical interpretation | ✅ | Notebook Section 7 |
| 9 | Business conclusions | ✅ | Notebook Section 9 |
| 10 | Recommendations | ✅ | Notebook Section 10 |
| 11 | Limitations | ✅ | Notebook Section 12 |
| – | Notebook runs top to bottom without errors | ✅ | Verified via `nbconvert --execute` |
| – | Code is clearly commented | ✅ | Throughout notebook |

---

## Presentation Requirements (Section 3 of Assignment)

| Slide | Requirement | Status | Slide Number |
|---|---|---|---|
| a | Title slide (company, project title, group names, course, date) | ✅ | Slide 1 |
| b | Company overview (what it does, business model, why problem matters) | ✅ | Slide 2 |
| c | Dataset overview (rows, columns, variables, data quality) | ✅ | Slide 3 |
| d | Business problem statement (specific, operational, measurable) | ✅ | Slide 4 |
| e | Exploratory data analysis (charts, patterns, relationships) | ✅ | Slide 5 |
| f | Feature engineering and data preparation | ✅ | Slide 6 |
| g | AI/ML method used and why it fits | ✅ | Slide 7 |
| h | Model results and interpretation (plain English) | ✅ | Slide 8 |
| i | Business recommendations (specific and evidence-supported) | ✅ | Slide 10 |
| j | Expected business impact | ✅ | Slide 11 |
| k | Limitations and ethical/fairness considerations | ✅ | Slide 12 |
| l | Conclusion and Q&A | ✅ | Slide 13 |
| – | AI/ML terminology used correctly | ✅ | Throughout |
| – | Charts are readable and support business story | ✅ | Slides 5, 8, 9 |
| – | Speaker notes included | ✅ | All slides |

---

## Grading Rubric Mapping (4 Components × 1.25% each)

### Component 1: Business Problem and Framing (1.25%)
| Criterion | Evidence | Location |
|---|---|---|
| Clear problem statement | "36.7% return rate significantly above industry norms" | Notebook Intro, Slide 4 |
| Relevant company context | Hearthstone business model explained | Slide 2, Notebook Intro |
| Measurable outcome | `customer_return` binary target, ROC-AUC metrics | Notebook Sections 3, 7 |
| Logical project scope | 8 EDA questions, 3 models, 5 recommendations | Throughout |

### Component 2: Data Preparation and Exploration (1.25%)
| Criterion | Evidence | Location |
|---|---|---|
| Quality data cleaning | Binary encoding, datetime parsing, leakage prevention | Notebook Section 3 |
| Variable understanding | 20 columns inspected, all types verified | Notebook Section 2 |
| Meaningful visualizations | 12+ charts, all tied to business questions | Notebook Section 4 |
| Thorough exploratory analysis | 8 analyses (A–H) covering all stated questions | Notebook Section 4 |

### Component 3: AI/ML Method and Technical Execution (1.25%)
| Criterion | Evidence | Location |
|---|---|---|
| Appropriate method selection | Binary classification for binary target | Notebook Section 6, Slide 7 |
| Correct implementation | 4 models, pipelines, proper encoding | Notebook Section 6 |
| Reproducible notebook | Runs end-to-end without errors | Verified |
| Meaningful model evaluation | Accuracy, Precision, Recall, F1, AUC, CM, CV | Notebook Section 7 |

### Component 4: Business Interpretation and Recommendations (1.25%)
| Criterion | Evidence | Location |
|---|---|---|
| Clear explanation of findings | Plain-English EDA findings per analysis | Notebook Section 4 |
| Realistic recommendations | 5 prioritized, evidence-based recommendations | Notebook Section 10, Slide 10 |
| Estimated business impact | 3 scenarios (5%, 10%, 15% reduction) | Notebook Section 11, Slide 11 |
| Connection to business value | All findings tied to Hearthstone operations | Sections 9–10 |

---

## Step 4 — Value-Added Requirements (5 of 10 required; we completed all 10)

| Requirement | Status | Location |
|---|---|---|
| 1. Create new features or business metrics | ✅ | Notebook Section 5: price_band, weight_group, lead_time_category, shipping_pct |
| 2. Compare two or more segments | ✅ | Notebook Section 4: 8 segment comparisons (damage, category, shipping, assembly, etc.) |
| 3. Test more than one model or parameter setting | ✅ | Notebook Section 6: 4 models (Dummy, DT, RF, LR) |
| 4. Visualizations that support business story | ✅ | Notebook Section 4: 12+ charts, all with business interpretation |
| 5. Identify most important variables | ✅ | Notebook Section 8: Random Forest feature importance, top 20 features |
| 6. Estimate potential business impact | ✅ | Notebook Section 11: 3 scenarios, $20K–$60K savings range |
| 7. Connect findings to business operations | ✅ | Notebook Sections 9–10: Every finding mapped to operational action |
| 8. Ethical, fairness, customer experience risks | ✅ | Notebook Section 12: 5 ethical considerations |
| 9. Prioritized action plan | ✅ | Notebook Section 10: 5 recommendations ranked by urgency |
| 10. Additional data needed | ✅ | Notebook Sections 10 & 12: 5 data gaps identified |

**All 10 value-added requirements are fulfilled.**

---

## EDA Analysis Coverage

| Analysis | Business Question | Chart | Status |
|---|---|---|---|
| A | What % of orders are returned? | `A_return_rate.png` | ✅ |
| B | Are damaged products more likely returned? | `B_damage_vs_return.png` | ✅ |
| C | Does fulfillment time relate to returns? | `C_fulfillment_vs_return.png` | ✅ |
| D | Which product categories have highest return rates? | `D_category_return_rate.png`, `D_subcategory_return_rate.png` | ✅ |
| E | Do shipping methods differ in return rates? | `E_shipping_return_rate.png` | ✅ |
| F | Do assembly-required products return more? | `F_assembly_return_rate.png` | ✅ |
| G | Do returned products differ in price/shipping cost? | `G_price_shipping_return.png` | ✅ |
| H | What are the most common return reasons? | `H_return_reasons.png` | ✅ |

---

## Leakage Prevention Checklist

| Column | Action | Reason |
|---|---|---|
| `return_reason` | ❌ Excluded from model features | Only known after return event — target leakage |
| `restocking_fee_usd` | ❌ Excluded from model features | Only charged after return is processed |
| `customer_rating` | ❌ Excluded from model features | May be recorded post-experience |
| `product_damaged_bin` | ⚠️ Included with caveat | Timing ambiguous — noted in limitations |
| `customer_return` | ✅ Used as target only | Never used as a feature |

---

## Deliverables Checklist

| Deliverable | Status | File |
|---|---|---|
| Jupyter Notebook | ✅ Created and executed | `Hearthstone_Final_Project.ipynb` |
| Project Plan | ✅ Created | `Hearthstone_Project_Plan.docx` |
| PowerPoint Presentation | ✅ Created (13 slides) | `Hearthstone_Final_Presentation.pptx` |
| README | ✅ Created | `README.md` |
| Rubric Checklist | ✅ Created | `Rubric_Checklist.md` |
| Requirements file | ✅ Created | `requirements.txt` |
| Charts folder | ✅ Created (14 charts) | `charts/` |
| Original dataset | ✅ Unchanged | `R-HEARTHSTONE.csv` |

---

*BUAN/ITSS 4382 — Applied AI/ML | University of Texas at Dallas | November 2026*
