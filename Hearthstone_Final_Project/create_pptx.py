"""Creates Hearthstone_Final_Presentation.pptx — 13 slides, professional consulting design."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import os

# ── Colors ───────────────────────────────────────────────────────────────────
DARK_BLUE   = RGBColor(0x1A, 0x23, 0x7E)  # Navy
ACCENT_BLUE = RGBColor(0x21, 0x96, 0xF3)  # Material Blue
ORANGE      = RGBColor(0xFF, 0x57, 0x22)  # Accent
WHITE       = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GRAY  = RGBColor(0xF5, 0xF5, 0xF5)
DARK_GRAY   = RGBColor(0x42, 0x42, 0x42)
GREEN       = RGBColor(0x2E, 0x7D, 0x32)
RED         = RGBColor(0xC6, 0x28, 0x28)

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)

BLANK_LAYOUT = prs.slide_layouts[6]  # completely blank

def add_shape(slide, left, top, width, height, fill_color=None, line_color=None):
    from pptx.util import Emu
    shape = slide.shapes.add_shape(1, Inches(left), Inches(top), Inches(width), Inches(height))
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
    else:
        shape.line.fill.background()
    return shape

def add_textbox(slide, text, left, top, width, height,
                font_size=18, bold=False, italic=False,
                color=DARK_GRAY, align=PP_ALIGN.LEFT, wrap=True):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return txBox

def add_multiline_textbox(slide, lines, left, top, width, height,
                          font_size=14, color=DARK_GRAY, bold_first=False):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.space_before = Pt(2)
        run = p.add_run()
        run.text = line
        run.font.size = Pt(font_size)
        run.font.color.rgb = color
        if bold_first and i == 0:
            run.font.bold = True
    return txBox

def header_bar(slide, title_text, subtitle_text=None):
    """Dark-blue header bar across the top of a content slide."""
    bar = add_shape(slide, 0, 0, 13.33, 1.1, fill_color=DARK_BLUE)
    add_textbox(slide, title_text, 0.25, 0.1, 10, 0.65,
                font_size=24, bold=True, color=WHITE, align=PP_ALIGN.LEFT)
    if subtitle_text:
        add_textbox(slide, subtitle_text, 0.25, 0.72, 10, 0.35,
                    font_size=13, italic=True, color=ACCENT_BLUE, align=PP_ALIGN.LEFT)
    # Accent stripe
    add_shape(slide, 0, 1.1, 13.33, 0.07, fill_color=ORANGE)

def speaker_note(slide, text):
    notes = slide.notes_slide
    tf = notes.notes_text_frame
    tf.text = text

def add_image(slide, path, left, top, width, height=None):
    if os.path.exists(path):
        if height:
            slide.shapes.add_picture(path, Inches(left), Inches(top), Inches(width), Inches(height))
        else:
            slide.shapes.add_picture(path, Inches(left), Inches(top), Inches(width))

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — Title
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
# Full background
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=DARK_BLUE)
# White content area
add_shape(slide, 0.4, 1.2, 12.5, 5.6, fill_color=WHITE)
# Orange accent bar
add_shape(slide, 0, 0, 13.33, 0.25, fill_color=ORANGE)
add_shape(slide, 0, 7.25, 13.33, 0.25, fill_color=ORANGE)

add_textbox(slide, 'BUAN/ITSS 4382 — Applied AI/ML', 0.5, 1.4, 12.3, 0.5,
            font_size=14, italic=True, color=DARK_GRAY, align=PP_ALIGN.CENTER)
add_textbox(slide, 'HEARTHSTONE', 0.5, 1.9, 12.3, 0.9,
            font_size=42, bold=True, color=DARK_BLUE, align=PP_ALIGN.CENTER)
add_textbox(slide, 'Predicting and Reducing Product Returns', 0.5, 2.75, 12.3, 0.65,
            font_size=22, bold=True, color=ACCENT_BLUE, align=PP_ALIGN.CENTER)
add_textbox(slide, 'Using Machine Learning', 0.5, 3.35, 12.3, 0.55,
            font_size=22, color=DARK_GRAY, align=PP_ALIGN.CENTER)

# Divider
add_shape(slide, 2.5, 4.05, 8.33, 0.04, fill_color=ACCENT_BLUE)

add_textbox(slide, '[ Group Member Names ]', 0.5, 4.2, 12.3, 0.4,
            font_size=16, color=DARK_GRAY, align=PP_ALIGN.CENTER)
add_textbox(slide, 'University of Texas at Dallas  |  November 17, 2026', 0.5, 4.65, 12.3, 0.35,
            font_size=13, italic=True, color=DARK_GRAY, align=PP_ALIGN.CENTER)

speaker_note(slide, "Welcome. Today we're presenting our BUAN 4382 final project on Hearthstone, an online furniture marketplace. We investigated their product return problem using machine learning and developed specific recommendations to help reduce their return rate.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — Company Overview
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Company Overview', 'Who Is Hearthstone?')

# Left column
add_shape(slide, 0.3, 1.3, 6.1, 5.9, fill_color=WHITE)
add_textbox(slide, 'About Hearthstone', 0.5, 1.4, 5.7, 0.4,
            font_size=16, bold=True, color=DARK_BLUE)
facts = [
    '• Online furniture & home décor marketplace',
    '• 18M+ products: sofas, dining, lighting, outdoor',
    '• Serves homeowners, renters, design enthusiasts',
    '• Nationwide delivery + White Glove installation',
    '• Competes with Wayfair, Overstock, West Elm',
    '',
    'Sector: Retail & E-Commerce (Home Goods)',
    'Business Model: Online Marketplace',
]
add_multiline_textbox(slide, facts, 0.5, 1.9, 5.7, 4.5, font_size=14)

# Right column
add_shape(slide, 6.7, 1.3, 6.3, 5.9, fill_color=WHITE)
add_textbox(slide, 'Why Returns Matter', 6.9, 1.4, 5.9, 0.4,
            font_size=16, bold=True, color=DARK_BLUE)
impacts = [
    '• Returns cost furniture retailers 2–4× more',
    '  than other product categories',
    '',
    '• Reverse logistics: pickup, inspection, restock',
    '',
    '• Each return erodes margin and customer trust',
    '',
    '• Hearthstone\'s 36.7% return rate is ABOVE',
    '  the ~20–25% furniture e-commerce average',
    '',
    '→ Reducing returns = direct profit improvement',
]
add_multiline_textbox(slide, impacts, 6.9, 1.9, 5.9, 4.5, font_size=13, color=DARK_GRAY)

speaker_note(slide, "Hearthstone sells furniture and home décor online. The company's model is similar to Wayfair. Their business challenge: a 36.7% return rate that is significantly above industry norms. Every return triggers a costly process of pickup, inspection, and restocking — directly hurting margins.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — Dataset Overview
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Dataset Overview', 'R-HEARTHSTONE.csv — 10,000 Orders, 20 Columns')

# Stats boxes
stats = [
    ('10,000', 'Total Orders'),
    ('20', 'Variables'),
    ('36.7%', 'Return Rate'),
    ('0', 'Duplicates'),
]
for i, (val, label) in enumerate(stats):
    x = 0.3 + i * 3.2
    add_shape(slide, x, 1.3, 2.9, 1.3, fill_color=DARK_BLUE)
    add_textbox(slide, val, x, 1.4, 2.9, 0.65, font_size=28, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_textbox(slide, label, x, 2.0, 2.9, 0.4, font_size=12, color=ACCENT_BLUE, align=PP_ALIGN.CENTER)

# Column listing
add_shape(slide, 0.3, 2.8, 6.1, 4.3, fill_color=WHITE)
add_textbox(slide, 'Key Variables', 0.5, 2.9, 5.7, 0.4, font_size=15, bold=True, color=DARK_BLUE)
cols_text = [
    'order_id, order_date',
    'product_category, product_subcategory',
    'product_price_usd, product_weight_lbs',
    'product_dimensions_cuft',
    'supplier_location, warehouse_location',
    'customer_state, shipping_method',
    'fulfillment_lead_time_days',
    'assembly_required (Yes/No)',
    'product_damaged (Yes/No)',
    'customer_return ← TARGET VARIABLE',
    'return_reason, customer_rating',
    'order_value_usd, shipping_cost_usd',
    'restocking_fee_usd',
]
add_multiline_textbox(slide, cols_text, 0.5, 3.35, 5.7, 3.7, font_size=11)

# Data quality
add_shape(slide, 6.7, 2.8, 6.3, 4.3, fill_color=WHITE)
add_textbox(slide, 'Data Quality Notes', 6.9, 2.9, 5.9, 0.4, font_size=15, bold=True, color=DARK_BLUE)
quality = [
    '✓ No duplicate rows or order IDs',
    '✓ No unexpected categorical values',
    '✓ Date range: Jan 2024 – Dec 2024',
    '',
    '⚠ return_reason: 6,334 missing (63.3%)',
    '  → Expected: only returned orders have reasons',
    '  → NOT blindly dropped; treated correctly',
    '',
    '⚠ restocking_fee_usd = $0 for non-returns',
    '  → Post-return variable; excluded from model',
    '',
    '✓ Binary encoding: Yes/No → 1/0',
    '✓ Datetime parsed for order_date',
]
add_multiline_textbox(slide, quality, 6.9, 3.35, 5.9, 3.7, font_size=11, color=DARK_GRAY)

speaker_note(slide, "Our dataset has 10,000 orders and 20 columns. One important data quality note: return_reason has 6,334 NaN values — but this is expected and correct, because only returned orders have a reason. We confirmed this programmatically and did not blindly drop those records. The restocking fee is zero for all non-returns, so we excluded it from modeling to prevent leakage.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — Business Problem
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Business Problem Statement', 'A 36.7% Return Rate Demands Attention')

# Problem box
add_shape(slide, 0.3, 1.3, 12.7, 1.5, fill_color=DARK_BLUE)
add_textbox(slide, '❝ Hearthstone\'s product return rate of 36.7% significantly exceeds industry norms.'
            ' The company needs to understand which operational and product factors drive returns,'
            ' and whether machine learning can identify high-risk orders before they ship. ❞',
            0.5, 1.4, 12.3, 1.3, font_size=15, italic=True, color=WHITE, align=PP_ALIGN.CENTER)

# Specific questions
questions_col1 = [
    '1. What % of orders are returned?',
    '2. Which product categories have highest return rates?',
    '3. Are damaged products more likely returned?',
    '4. Do longer fulfillment times increase returns?',
]
questions_col2 = [
    '5. Do shipping method & assembly matter?',
    '6. Can ML accurately predict returns?',
    '7. Which factors matter most for prediction?',
    '8. What actions should Hearthstone prioritize?',
]

add_shape(slide, 0.3, 3.0, 6.1, 4.0, fill_color=WHITE)
add_textbox(slide, 'Research Questions', 0.5, 3.1, 5.7, 0.4, font_size=15, bold=True, color=DARK_BLUE)
add_multiline_textbox(slide, questions_col1, 0.5, 3.6, 5.7, 3.0, font_size=13)

add_shape(slide, 6.7, 3.0, 6.3, 4.0, fill_color=WHITE)
add_textbox(slide, 'Key Metrics', 6.9, 3.1, 5.9, 0.4, font_size=15, bold=True, color=DARK_BLUE)
key_metrics = [
    'Target Variable: customer_return (Yes=1, No=0)',
    '',
    'Success Metrics:',
    '• F1-Score > dummy baseline',
    '• ROC-AUC > 0.70',
    '• Business-actionable findings',
    '• Prioritized recommendations',
]
add_multiline_textbox(slide, key_metrics + questions_col2, 6.9, 3.6, 5.9, 3.0, font_size=13)

speaker_note(slide, "The business problem is clear and measurable: Hearthstone's 36.7% return rate is too high. We structured our investigation around 8 specific business questions. The target variable is customer_return — a binary outcome that makes this a classification problem.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — EDA (Key Findings)
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Exploratory Data Analysis', 'Key Patterns Discovered in the Data')

# Top stats
kpi_data = [
    ('36.7%', 'Overall Return Rate', ORANGE),
    ('55.6%', 'Furniture Return Rate', RED),
    ('71.7%', 'Return Rate — Damaged Products', RED),
    ('54.6%', 'Return Rate — Assembly Required', ORANGE),
]
for i, (val, label, color) in enumerate(kpi_data):
    x = 0.3 + i * 3.2
    add_shape(slide, x, 1.3, 2.9, 1.1, fill_color=color)
    add_textbox(slide, val, x, 1.35, 2.9, 0.55, font_size=26, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_textbox(slide, label, x, 1.88, 2.9, 0.42, font_size=10, color=WHITE, align=PP_ALIGN.CENTER)

# Charts
add_image(slide, 'charts/B_damage_vs_return.png', 0.3, 2.55, 6.3, 2.4)
add_image(slide, 'charts/D_category_return_rate.png', 6.8, 2.55, 6.2, 2.4)

# Bottom findings
add_shape(slide, 0.3, 5.1, 12.7, 2.0, fill_color=WHITE)
findings = [
    '■ Damage: 71.7% return rate vs. 31.6% for undamaged (+40 ppts)   '
    '■ Fulfillment time: Returned orders avg 23.5 days vs. 18.8 days (non-returned)',
    '■ Assembly Required: 54.6% vs. 28.2% return rate              '
    '■ White Glove shipping: 52.1% return rate (vs. 28.7% Expedited)',
    '■ Top return reasons: Changed Mind (21%), Damaged (20%), Assembly Issues (18%), Late Delivery (16%)',
]
add_multiline_textbox(slide, findings, 0.5, 5.2, 12.3, 1.8, font_size=12, color=DARK_GRAY)

speaker_note(slide, "The EDA revealed several strong patterns. Product damage is the most striking: 71.7% of damaged items are returned — more than double the rate for undamaged items. Furniture has a 55.6% return rate, far above all other categories. Assembly-required products also show significantly higher return rates. And our fulfillment analysis shows returned orders took an average of 4.7 more days to arrive. 'Changed Mind' is the top return reason, followed closely by 'Damaged' and 'Assembly Issues'.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — Feature Engineering & Preprocessing
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Feature Engineering & Data Preparation', 'Transforming Raw Data for Machine Learning')

# Left: preprocessing steps
add_shape(slide, 0.3, 1.3, 6.1, 5.9, fill_color=WHITE)
add_textbox(slide, 'Data Preparation Steps', 0.5, 1.4, 5.7, 0.4, font_size=15, bold=True, color=DARK_BLUE)
prep_steps = [
    '1. Binary encoding: Yes/No → 1/0',
    '   (assembly_required, product_damaged,',
    '    customer_return)',
    '',
    '2. Datetime parsing: order_date',
    '   → order_month, order_quarter',
    '',
    '3. One-Hot Encoding: 6 categorical columns',
    '   (category, subcategory, supplier,',
    '    warehouse, state, shipping method)',
    '',
    '4. Scaling: StandardScaler for Logistic',
    '   Regression numeric features',
    '',
    '5. Train-Test Split: 80/20, stratified,',
    '   random_state=42',
    '   • Training: 8,000 rows',
    '   • Test:     2,000 rows',
]
add_multiline_textbox(slide, prep_steps, 0.5, 1.9, 5.7, 5.2, font_size=12.5)

# Right: engineered features + leakage
add_shape(slide, 6.7, 1.3, 6.3, 2.8, fill_color=WHITE)
add_textbox(slide, 'Engineered Features', 6.9, 1.4, 5.9, 0.4, font_size=15, bold=True, color=DARK_BLUE)
eng_feats = [
    'price_band: Price tier groups',
    '(<$100 to >$1000)',
    '',
    'lead_time_category: 4 speed tiers',
    '(Fast / Standard / Slow / Very Slow)',
    '',
    'weight_group: 4 weight classes',
    '(Light / Medium / Heavy / Very Heavy)',
    '',
    'shipping_pct_of_order: Shipping cost / order value',
]
add_multiline_textbox(slide, eng_feats, 6.9, 1.9, 5.9, 2.0, font_size=12)

# Leakage box
add_shape(slide, 6.7, 4.25, 6.3, 3.0, fill_color=RGBColor(0xFF, 0xF3, 0xE0))
add_textbox(slide, '⚠ Data Leakage Prevention', 6.9, 4.35, 5.9, 0.4,
            font_size=14, bold=True, color=ORANGE)
leakage_items = [
    'EXCLUDED from model features:',
    '',
    '✗ return_reason — only known post-return',
    '✗ restocking_fee_usd — only charged',
    '  after return is processed',
    '✗ customer_rating — recorded after',
    '  customer experience, not before',
    '',
    '→ 14 features used; test set held out',
    '  until final evaluation only',
]
add_multiline_textbox(slide, leakage_items, 6.9, 4.8, 5.9, 2.4, font_size=11, color=DARK_GRAY)

speaker_note(slide, "Data preparation was critical for a valid analysis. We encoded Yes/No variables to binary, one-hot encoded categorical features, and scaled numerics for Logistic Regression. We created four engineered features to add business meaning. Most importantly, we excluded three variables to prevent data leakage: return_reason (only known after return), restocking_fee (only charged after return), and customer_rating (may be recorded post-experience). The test set was held out until final evaluation.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — Model Selection & Justification
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Model Selection & Justification', 'Why Binary Classification? Why These Models?')

# Justification box
add_shape(slide, 0.3, 1.3, 12.7, 0.9, fill_color=DARK_BLUE)
add_textbox(slide, 'Binary Classification is the right method: our target is a binary yes/no outcome'
            ' — did the customer return the product? Classification models predict this directly'
            ' and produce probability scores for risk stratification.',
            0.5, 1.37, 12.3, 0.76, font_size=13, color=WHITE, italic=True, align=PP_ALIGN.CENTER)

# 4 model boxes
model_info = [
    ('Model 0', 'Dummy Classifier', 'Strategy: Always predict "No Return"\nSets performance floor\nAny real model must beat 63.3% accuracy', '#9E9E9E'),
    ('Model 1', 'Decision Tree\n(max_depth=5)', 'Mimics human if-then rules\nHighly interpretable\nHandles mixed data types\nBaseline required by assignment', '#2196F3'),
    ('Model 2', 'Random Forest\n(200 trees)', 'Ensemble of decision trees\nReduces overfitting via averaging\nProvides feature importance scores\nTypically outperforms single tree', '#4CAF50'),
    ('Model 3', 'Logistic Regression', 'Linear probabilistic classifier\nOutputs calibrated probabilities\nRequires feature scaling\nGold standard interpretable benchmark', '#FF9800'),
]
for i, (label, name, desc, color) in enumerate(model_info):
    x = 0.3 + i * 3.2
    add_shape(slide, x, 2.35, 2.9, 0.4, fill_color=RGBColor.from_string(color[1:]))
    add_textbox(slide, label, x, 2.38, 2.9, 0.33, font_size=11, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_shape(slide, x, 2.75, 2.9, 4.5, fill_color=WHITE)
    add_textbox(slide, name, x+0.1, 2.85, 2.7, 0.55, font_size=14, bold=True, color=DARK_BLUE)
    add_multiline_textbox(slide, desc.split('\n'), x+0.1, 3.45, 2.7, 3.7, font_size=12, color=DARK_GRAY)

# Common settings
add_shape(slide, 0.3, 7.0, 12.7, 0.3, fill_color=DARK_BLUE)
add_textbox(slide, 'All models: 80/20 stratified split | random_state=42 | 5-fold CV for validation | Same test set for fair comparison',
            0.5, 7.03, 12.3, 0.24, font_size=11, color=WHITE, align=PP_ALIGN.CENTER)

speaker_note(slide, "We built four models for this classification problem. We start with a Dummy Classifier as our performance floor — it always predicts 'No Return' and achieves 63.3% accuracy. Any real model must beat this. The Decision Tree is required by the project brief and is highly interpretable. Random Forest is an ensemble method that typically outperforms single trees. Logistic Regression provides a well-calibrated linear benchmark. All models use the same train-test split for a fair comparison.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — Model Results
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Model Results', 'Performance on Hold-Out Test Set (2,000 orders)')

# Comparison chart
add_image(slide, 'charts/MODEL_comparison.png', 0.3, 1.3, 7.8, 3.3)

# Results table
add_shape(slide, 8.3, 1.3, 4.7, 3.3, fill_color=WHITE)
add_textbox(slide, 'Key Metrics Summary', 8.4, 1.4, 4.5, 0.35, font_size=13, bold=True, color=DARK_BLUE)
table_data = [
    ['Model', 'Acc', 'F1', 'AUC'],
    ['Dummy', '63.3%', '0.00', 'N/A'],
    ['Decision Tree', '69.8%', '0.54', '0.719'],
    ['Random Forest', '70.2%', '0.55', '0.733'],
    ['Log. Regression', '70.4%', '0.54', '0.737'],
]
for row_i, row in enumerate(table_data):
    for col_i, cell in enumerate(row):
        x = 8.4 + col_i * 1.1
        y = 1.9 + row_i * 0.47
        bg = DARK_BLUE if row_i == 0 else (RGBColor(0xE8, 0xF5, 0xE9) if row_i == 3 else WHITE)
        fc = WHITE if row_i == 0 else DARK_GRAY
        add_shape(slide, x, y, 1.05, 0.44, fill_color=bg)
        add_textbox(slide, cell, x, y+0.05, 1.05, 0.34, font_size=11,
                    bold=(row_i == 0 or row_i == 3), color=fc, align=PP_ALIGN.CENTER)

# ROC curve
add_image(slide, 'charts/MODEL_roc_curves.png', 0.3, 4.75, 6.5, 2.4)

# Key takeaways
add_shape(slide, 7.0, 4.75, 6.0, 2.4, fill_color=WHITE)
add_textbox(slide, 'Key Takeaways', 7.2, 4.85, 5.6, 0.35, font_size=13, bold=True, color=DARK_BLUE)
takeaways = [
    '✓ All models beat dummy baseline',
    '✓ AUC ~0.73 = moderate predictive power',
    '✓ Logistic Regression: best AUC (0.737)',
    '✓ Random Forest: best for feature importance',
    '⚠ Recall ~49%: catches half of actual returns',
    '⚠ Models help risk-stratify, not replace judgment',
]
add_multiline_textbox(slide, takeaways, 7.2, 5.3, 5.6, 1.8, font_size=12, color=DARK_GRAY)

speaker_note(slide, "All three real models significantly outperform the dummy baseline. Logistic Regression achieves the best ROC-AUC at 0.737. This means that given two orders — one returned and one not — the model correctly ranks the returned one as higher risk 73.7% of the time. The recall of about 49% means we catch roughly half of actual returns — good for risk stratification but not for fully automated decisions. The models are most valuable as a prioritization tool, not a replacement for human judgment.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — Feature Importance
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Feature Importance', 'Which Factors Are Most Predictive of Returns?')

add_image(slide, 'charts/FEAT_importance_rf.png', 0.3, 1.3, 7.3, 5.9)

# Right interpretation
add_shape(slide, 7.8, 1.3, 5.2, 5.9, fill_color=WHITE)
add_textbox(slide, 'Interpretation', 8.0, 1.4, 4.9, 0.35, font_size=14, bold=True, color=DARK_BLUE)
feat_interp = [
    '① product_damaged (17.3%)',
    '  Strongest predictor — damaged items',
    '  are returned at 71.7% rate',
    '',
    '② product_weight_lbs (10.9%)',
    '  Heavier items harder to ship safely',
    '',
    '③ product_price_usd (9.9%)',
    '  Higher-priced items have higher',
    '  customer expectations',
    '',
    '④ fulfillment_lead_time (9.3%)',
    '  Longer waits → more returns',
    '',
    '⑤ Furniture category (7.7%)',
    '  Confirms EDA: Furniture is high-risk',
    '',
    '⑥ assembly_required (5.7%)',
    '  Assembly complexity drives returns',
    '',
    '⚠ Importance ≠ Causation',
    '  Correlation-based importance only',
]
add_multiline_textbox(slide, feat_interp, 8.0, 1.85, 4.9, 5.4, font_size=11.5, color=DARK_GRAY)

speaker_note(slide, "The Random Forest feature importance chart shows which variables are most useful for predicting returns. Product damage status is by far the strongest predictor at 17.3%, consistent with our EDA finding. Product weight and price follow, reflecting that heavier and more expensive items are harder to ship undamaged and have higher customer expectations. Fulfillment lead time and the Furniture category are also strong predictors. Important caveat: feature importance shows correlation, not causation. These features help the model distinguish returns from non-returns — they don't prove that changing them will reduce returns.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 10 — Business Recommendations
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Business Recommendations', 'Five Evidence-Based, Prioritized Actions')

recs = [
    ('1', 'Improve Packaging & Damage Prevention', 'IMMEDIATE',
     '71.7% of damaged items are returned. Audit packaging for Furniture & heavy items. Implement pre-shipment quality checks.',
     '#C62828'),
    ('2', 'Address Furniture Category (55.6% Return Rate)', 'IMMEDIATE',
     'Video assembly guides. Subsidize professional assembly for items >$500. Improve 360° product photos and dimension accuracy.',
     '#E65100'),
    ('3', 'Reduce Fulfillment Lead Times', 'SHORT-TERM',
     'Flag orders >21 days for proactive customer communication. Expedite high-value orders. "Late Delivery" = 16% of return reasons.',
     '#1565C0'),
    ('4', 'Deploy ML Return-Risk Scoring', 'SHORT-TERM',
     '0.73 AUC sufficient for risk stratification. Score orders at checkout. High-risk orders → quality check before shipment.',
     '#2E7D32'),
    ('5', 'Address "Changed Mind" Returns (21%)', 'MEDIUM-TERM',
     'Improve product photography (360° views, AR tools). More detailed descriptions and customer reviews to set accurate expectations.',
     '#6A1B9A'),
]

for i, (num, title, timeline, desc, color) in enumerate(recs):
    y = 1.3 + i * 1.2
    add_shape(slide, 0.3, y, 0.5, 1.0, fill_color=RGBColor.from_string(color[1:]))
    add_textbox(slide, num, 0.3, y+0.2, 0.5, 0.6, font_size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_shape(slide, 0.95, y, 11.9, 1.0, fill_color=WHITE)
    add_textbox(slide, title, 1.05, y+0.05, 8.0, 0.4, font_size=14, bold=True, color=DARK_BLUE)
    add_shape(slide, 9.9, y+0.05, 2.5, 0.35,
              fill_color=RGBColor.from_string(color[1:]))
    add_textbox(slide, timeline, 9.9, y+0.05, 2.5, 0.35, font_size=10, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_textbox(slide, desc, 1.05, y+0.5, 11.0, 0.45, font_size=11.5, color=DARK_GRAY)

speaker_note(slide, "Our five recommendations are prioritized by evidence strength and expected impact. The two immediate priorities — fixing packaging to reduce damage, and addressing the Furniture category — have the strongest data support. The 71.7% return rate for damaged items leaves no doubt. Medium-term, we recommend deploying the ML scoring model to flag high-risk orders, reducing fulfillment times for the longest-wait orders, and improving product page content to reduce 'Changed Mind' returns.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 11 — Business Impact
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Expected Business Impact', 'Quantifying the Value of Reducing Returns')

# Disclaimer
add_shape(slide, 0.3, 1.3, 12.7, 0.6, fill_color=RGBColor(0xFF, 0xF3, 0xE0))
add_textbox(slide, '⚠ Disclaimer: These are illustrative scenarios using actual dataset values. '
            'The $50/return operational cost is a conservative estimate (reverse logistics + labor). '
            'Product refund value is NOT counted as a cost — products are restocked, not destroyed.',
            0.5, 1.33, 12.3, 0.54, font_size=11, italic=True, color=ORANGE, align=PP_ALIGN.CENTER)

# Baseline
add_shape(slide, 0.3, 2.05, 12.7, 0.75, fill_color=DARK_BLUE)
baseline_text = ('Baseline: 10,000 orders | 3,666 returns (36.7%) | '
                 'Avg restocking fee: $59.17 | Avg order value: $692.98')
add_textbox(slide, baseline_text, 0.5, 2.1, 12.3, 0.6, font_size=13, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

# Impact scenarios
scenarios = [
    ('5% Return Reduction', '183 fewer returns', '$10,828', '$9,150', '$19,978', ACCENT_BLUE),
    ('10% Return Reduction', '366 fewer returns', '$21,656', '$18,300', '$39,956', GREEN),
    ('15% Return Reduction', '549 fewer returns', '$32,484', '$27,450', '$59,934', RED),
]
for i, (scenario, avoided, restocking, ops, total, color) in enumerate(scenarios):
    x = 0.3 + i * 4.3
    add_shape(slide, x, 2.95, 4.0, 0.5, fill_color=color)
    add_textbox(slide, scenario, x, 2.98, 4.0, 0.44, font_size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_shape(slide, x, 3.5, 4.0, 3.5, fill_color=WHITE)
    details = [
        avoided,
        f'Restocking recovered: {restocking}',
        f'Operational savings: {ops}',
        '',
        f'TOTAL SAVINGS: {total}',
    ]
    add_multiline_textbox(slide, details, x+0.1, 3.6, 3.8, 3.2, font_size=13, color=DARK_GRAY)
    # Highlight total
    add_textbox(slide, total, x+0.1, 6.5, 3.8, 0.4, font_size=18, bold=True, color=color, align=PP_ALIGN.CENTER)

# Strategic note
add_shape(slide, 0.3, 7.05, 12.7, 0.3, fill_color=DARK_BLUE)
add_textbox(slide, 'Scale note: These savings assume current order volume. Hearthstone likely processes far more orders annually than our 10K sample represents.',
            0.5, 7.08, 12.3, 0.24, font_size=10, color=WHITE, align=PP_ALIGN.CENTER)

speaker_note(slide, "These three scenarios show the potential savings from reducing the return rate. Even a conservative 5% relative reduction avoids 183 returns and saves roughly $20,000 in restocking fees and operational costs. A 15% reduction saves nearly $60,000. And this is from our 10,000-order sample — Hearthstone's real order volume would generate proportionally larger savings. We're not claiming the ML model delivers this directly — these are business scenarios that show the value of ANY successful intervention.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 12 — Limitations & Ethics
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=LIGHT_GRAY)
header_bar(slide, 'Limitations & Ethical Considerations', 'What We Cannot Prove — What We Must Consider')

# Left: Limitations
add_shape(slide, 0.3, 1.3, 6.1, 5.9, fill_color=WHITE)
add_textbox(slide, 'Analytical Limitations', 0.5, 1.4, 5.7, 0.4, font_size=15, bold=True, color=DARK_BLUE)
lims = [
    'Data Limitations:',
    '• product_damaged timing uncertain —',
    '  may only be known post-delivery',
    '• Single year (2024) — may not generalize',
    '• Return processing cost unknown —',
    '  limits precise ROI estimation',
    '• No customer ID — cannot assess repeat',
    '  returners or customer lifetime value',
    '',
    'Model Limitations:',
    '• Moderate accuracy (~70%) — not suitable',
    '  for fully automated decisions',
    '• Recall ~49% — misses ~half of returns',
    '• Correlation ≠ Causation — no feature',
    '  is proven to cause returns',
    '• Slight overfitting in Random Forest',
    '  (Train 81.2% vs Test 70.2%)',
]
add_multiline_textbox(slide, lims, 0.5, 1.9, 5.7, 5.2, font_size=12, color=DARK_GRAY)

# Right: Ethics
add_shape(slide, 6.7, 1.3, 6.3, 5.9, fill_color=WHITE)
add_textbox(slide, 'Ethical & Fairness Considerations', 6.9, 1.4, 5.9, 0.4, font_size=15, bold=True, color=DARK_BLUE)
ethics = [
    'Fairness by Geography:',
    '• Model penalizes certain customer states',
    '  or supplier locations — could reduce',
    '  service quality in those regions',
    '',
    'Customer Experience:',
    '• Additional scrutiny for flagged orders',
    '  must not create friction for legitimate',
    '  customers making valid purchases',
    '',
    'Transparency:',
    '• Stakeholders must understand what',
    '  drives predictions and be able to',
    '  override model recommendations',
    '',
    'Feedback Loops:',
    '• Restricting high-risk items could bias',
    '  future training data over time',
    '',
    'Privacy: Customer state data must comply',
    'with CCPA and applicable regulations',
]
add_multiline_textbox(slide, ethics, 6.9, 1.9, 5.9, 5.2, font_size=12, color=DARK_GRAY)

speaker_note(slide, "Every analysis has limitations. Our biggest concern is that product_damaged timing is unclear — if damage is only detected post-delivery, it cannot be used for pre-shipment predictions. Our models have moderate performance — useful for risk stratification, but not for automated decisions without human oversight. On the ethical side, we must be careful that the model doesn't disadvantage customers in certain states or from certain suppliers in a way that creates unfair service disparities. All recommendations should be implemented with human review and regular bias audits.")

# ════════════════════════════════════════════════════════════════════════════
# SLIDE 13 — Conclusion
# ════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(BLANK_LAYOUT)
add_shape(slide, 0, 0, 13.33, 7.5, fill_color=DARK_BLUE)
add_shape(slide, 0, 0, 13.33, 0.2, fill_color=ORANGE)
add_shape(slide, 0, 7.3, 13.33, 0.2, fill_color=ORANGE)

add_textbox(slide, 'CONCLUSION & KEY TAKEAWAYS', 0.5, 0.4, 12.3, 0.6,
            font_size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_textbox(slide, 'Predicting and Reducing Product Returns at Hearthstone', 0.5, 0.95, 12.3, 0.4,
            font_size=14, italic=True, color=ACCENT_BLUE, align=PP_ALIGN.CENTER)

# White content area
add_shape(slide, 0.4, 1.5, 12.5, 5.5, fill_color=WHITE)

takeaways_final = [
    '① Return rate of 36.7% is significantly above industry average — a confirmed, measurable problem.',
    '',
    '② Furniture (55.6%), assembly-required items (54.6%), and damaged products (71.7%) are highest-risk segments.',
    '',
    '③ ML models (ROC-AUC ~0.73) can identify high-risk orders — useful for proactive intervention, not automation.',
    '',
    '④ Top return reasons: Changed Mind (21%), Damaged (20%), Assembly Issues (18%), Late Delivery (16%).',
    '',
    '⑤ Priority 1: Fix packaging to reduce damage. Priority 2: Address Furniture category operations.',
    '',
    '⑥ A 10% return reduction saves an estimated $40,000 in this 10K-order sample — scalable across full operations.',
    '',
    'BOTTOM LINE: Hearthstone should immediately focus on reducing product damage and improving the',
    'Furniture purchase experience. These two interventions have the strongest evidence and highest ROI.',
]
add_multiline_textbox(slide, takeaways_final, 0.6, 1.65, 12.1, 5.2, font_size=13, color=DARK_GRAY)

speaker_note(slide, "In summary: Hearthstone has a real and measurable return problem at 36.7%. Our analysis identified the key drivers: product damage, Furniture category complexity, fulfillment delays, and assembly challenges. Machine learning can help identify high-risk orders with about 73% discriminative ability. Our top recommendations are to immediately improve packaging and address the Furniture category experience. We estimate a 10% reduction in returns could save $40,000 from this sample alone — with significantly larger impact at full company scale. Thank you — we're ready for questions.")

# Save
prs.save('Hearthstone_Final_Presentation.pptx')
print("Saved: Hearthstone_Final_Presentation.pptx")
