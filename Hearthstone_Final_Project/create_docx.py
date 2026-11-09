"""Creates Hearthstone_Project_Plan.docx"""
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

# ── Styles ──────────────────────────────────────────────────────────────────
def set_heading(para, text, level=1, color=(0x1A, 0x23, 0x7E)):
    para.text = ''
    run = para.add_run(text)
    run.bold = True
    run.font.size = Pt(16 if level == 1 else 13 if level == 2 else 11)
    run.font.color.rgb = RGBColor(*color)

def add_heading(doc, text, level=1, color=(0x1A, 0x23, 0x7E)):
    para = doc.add_paragraph()
    para.style = 'Normal'
    if level == 1:
        para.paragraph_format.space_before = Pt(12)
    set_heading(para, text, level, color)
    return para

def add_body(doc, text):
    p = doc.add_paragraph(text)
    p.style = 'Normal'
    p.paragraph_format.space_after = Pt(4)
    return p

def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    if bold_prefix:
        run = p.add_run(bold_prefix)
        run.bold = True
        p.add_run(text)
    else:
        p.add_run(text)
    return p

# ── Title ───────────────────────────────────────────────────────────────────
title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title.add_run('HEARTHSTONE PROJECT PLAN')
run.bold = True
run.font.size = Pt(20)
run.font.color.rgb = RGBColor(0x1A, 0x23, 0x7E)

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub.add_run('BUAN/ITSS 4382 — Applied AI/ML | University of Texas at Dallas').italic = True

sub2 = doc.add_paragraph()
sub2.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub2.add_run('Final Group Project | Due: November 17, 2026')

doc.add_paragraph('─' * 80)

# ── 1. Company and Dataset ───────────────────────────────────────────────────
add_heading(doc, '1. Selected Company and Dataset')
add_body(doc, 'Company: Hearthstone')
add_body(doc, 'Dataset: R-HEARTHSTONE.csv')
add_body(doc, 'Hearthstone is an online furniture and home décor marketplace offering a curated '
              'selection of over 18 million products including sofas, dining sets, lighting, and '
              'outdoor furniture. It serves homeowners, renters, and interior design enthusiasts '
              'seeking affordable to mid-range furnishings with nationwide delivery and white-glove '
              'installation services. Competitors include Wayfair, Overstock, Article, West Elm, and Amazon Home.')
add_body(doc, 'Dataset dimensions: 10,000 orders × 20 columns, covering April 2024 through December 2024.')

# ── 2. Business Problem ──────────────────────────────────────────────────────
add_heading(doc, '2. Business Problem')
add_body(doc, 'Hearthstone is experiencing a product return rate of approximately 36.7% — '
              'significantly above the e-commerce furniture industry average of roughly 20–25%. '
              'Each return event generates reverse logistics costs, restocking expenses, potential '
              'product damage, and customer dissatisfaction. At scale, an elevated return rate '
              'directly erodes margins and customer lifetime value.')
add_body(doc, 'Our team will investigate:')
add_bullet(doc, 'Which product categories, shipping methods, and operational factors are associated with higher return rates')
add_bullet(doc, 'Whether product damage, fulfillment delays, and assembly requirements contribute meaningfully to returns')
add_bullet(doc, 'Whether machine learning can accurately identify orders at higher risk of being returned')
add_bullet(doc, 'What operational actions Hearthstone should prioritize to reduce returns and associated costs')

# ── 3. Target Variable ───────────────────────────────────────────────────────
add_heading(doc, '3. Target Variable')
add_body(doc, 'Target variable: customer_return')
add_bullet(doc, 'Yes (encoded as 1) = Order was returned by the customer', None)
add_bullet(doc, 'No (encoded as 0) = Order was not returned', None)
add_body(doc, 'This is a binary classification problem. The dataset contains 3,666 returned orders '
              '(36.66%) and 6,334 non-returned orders (63.34%).')
add_body(doc, 'Excluded from predictive features (leakage prevention):')
add_bullet(doc, 'return_reason — only known after return event; using it would leak the target')
add_bullet(doc, 'restocking_fee_usd — only charged after a return is processed')
add_bullet(doc, 'customer_rating — may be recorded after the return experience')

# ── 4. Exploratory Questions ─────────────────────────────────────────────────
add_heading(doc, '4. Exploratory Questions')
questions = [
    ('Q1', 'What percentage of Hearthstone orders are returned, and how does this compare to industry norms?'),
    ('Q2', 'Are products that arrive damaged significantly more likely to be returned?'),
    ('Q3', 'Is fulfillment lead time (days from order to delivery) associated with return probability?'),
    ('Q4', 'Which product categories and subcategories experience the highest return rates?'),
    ('Q5', 'Do products requiring assembly have higher return rates than ready-to-use products?'),
]
for q_id, q_text in questions:
    add_bullet(doc, q_text, f'{q_id}: ')

# ── 5. Planned AI/ML Methods ─────────────────────────────────────────────────
add_heading(doc, '5. Planned AI/ML Methods')
add_body(doc, 'Primary method: Binary Classification')
add_body(doc, 'We will implement and compare four models:')
add_bullet(doc, 'Dummy Classifier (majority-class baseline) — establishes performance floor')
add_bullet(doc, 'Decision Tree Classifier (max_depth=5, random_state=42) — required project baseline; interpretable rule-based model')
add_bullet(doc, 'Random Forest Classifier — ensemble method for improved generalization and feature importance')
add_bullet(doc, 'Logistic Regression — interpretable linear benchmark with probability outputs')
add_body(doc, 'Evaluation metrics: Accuracy, Precision, Recall, F1-Score, ROC-AUC, Confusion Matrix.')
add_body(doc, 'Validation strategy: 80/20 stratified train-test split (random_state=42) with 5-fold '
              'cross-validation for model selection. Test set held out until final evaluation.')
add_body(doc, 'Why classification fits: The business question is whether a specific order will be '
              'returned — a binary yes/no outcome. Classification models directly predict this outcome '
              'and provide probability scores that enable risk stratification.')

# ── 6. Expected Business Recommendation Areas ────────────────────────────────
add_heading(doc, '6. Expected Business Recommendation Areas')
add_body(doc, 'Based on initial data inspection, we expect our recommendations to focus on:')
rec_areas = [
    ('Packaging and Damage Prevention',
     'Improving packaging standards to reduce the 12.7% product damage rate, which is associated with 71.7% return rate'),
    ('Furniture Category Operations',
     'Addressing the 55.6% return rate in Furniture through better assembly instructions, product photography, and AR tools'),
    ('Fulfillment Process Improvement',
     'Reducing fulfillment lead times, especially for high-risk orders, to decrease late-delivery returns'),
    ('ML-Driven Return-Risk Scoring',
     'Deploying a risk scoring system at the order level to trigger quality checks before shipment'),
    ('Product Description and Expectation Management',
     'Improving product page accuracy to reduce "Changed Mind" and "Not As Described" returns'),
]
for title_text, desc in rec_areas:
    add_bullet(doc, f'{desc}', f'{title_text}: ')

doc.add_paragraph()
doc.add_paragraph('─' * 80)
footer = doc.add_paragraph()
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.add_run('BUAN/ITSS 4382 — Hearthstone Group Project Plan | University of Texas at Dallas | November 2026')

doc.save('Hearthstone_Project_Plan.docx')
print("Saved: Hearthstone_Project_Plan.docx")
