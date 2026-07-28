# I-9 Correction Guide

Use this when remediating findings from the internal audit. Never backdate. Never use white-out or obliterate original text.

## General rules

1. **Draw a line** through incorrect information.
2. **Enter** the correct information.
3. **Initial and date** the change with the **actual** correction date.
4. **Section 1** corrections: the **employee** should make them (or complete a new Section 1 as directed below).
5. **Section 2 / 3** corrections: the **employer or authorized representative** makes them.
6. If the form is missing or too defective to salvage, complete a **new Form I-9**, keep the old one, and attach a **signed, dated memo** explaining what happened and what was done.

## Missing Form I-9 (current employee)

1. Have the employee complete **Section 1** of a current Form I-9 immediately.
2. Examine acceptable documents of the employee’s choice and complete **Section 2**.
3. Enter the employee’s **true first day of employment** in Section 2 (do not invent a new hire date).
4. Sign and date Section 2 with **today’s** date (do not backdate to the hire date).
5. Attach a memo: employee name, true hire date, that the original I-9 was missing, and that a new form was completed on [date] during an internal audit.
6. If E-Verify applies, follow current E-Verify rules for existing employees / late cases — do not create a false “new hire” narrative.

## Incomplete Section 1

| Issue | Action |
|-------|--------|
| Missing fields the employee can still complete | Employee adds info, initials, dates |
| Missing signature / date | Employee signs and dates with current date; note audit correction |
| Wrong attestation / immigration status fields | Employee corrects; do not coach them into a particular status |
| Preparer/translator used but not documented | Complete preparer/translator certification as required |

## Incomplete or late Section 2

| Issue | Action |
|-------|--------|
| Missing document details the reviewer originally saw | If same authorized representative recalls and business records support it, complete missing fields, initial, date — **do not guess** |
| Original reviewer unavailable / cannot verify | Complete a new Form I-9 with current document examination; attach memo; retain old form |
| Section 2 completed after day 3 | Cannot “fix” lateness. Note the late completion as a finding; ensure current form is otherwise complete; consider process training |
| Improper List A + List B/C combination | Line through the improper extra list entries, initial, date; ensure remaining documentation is sufficient |

## Reverification (Section 3 / Supplement B)

- Reverify **before** temporary work authorization expires when required.
- Do **not** reverify U.S. citizens or permanent List B identity documents.
- If reverification was missed and authorization is still valid: complete reverification now; document the late discovery in notes.
- If authorization expired and the person continued working: treat as high-priority substantive/process finding; involve counsel for remediation options.

## What not to do

- Do not request more or different documents than the Lists allow.
- Do not specify which documents an employee must present.
- Do not selectively audit or correct only certain national origins or citizenship statuses.
- Do not discard the old form when creating a new one during remediation.
- Do not backdate signatures or hire dates to hide timing failures.

## Memo template (attach to remediated / replacement forms)

```text
Internal Form I-9 Audit — Remediation Memo

Employee name:
Employee ID:
True first day of employment:
Date of this memo:

Reason for action:
☐ Original Form I-9 missing
☐ Original Form I-9 incomplete / defective
☐ Other: _______________________

Actions taken:
- Completed / corrected Form I-9 on ________ (actual date)
- Sections affected: ☐ 1  ☐ 2  ☐ 3 / Supplement B
- Old form retained and attached: ☐ Yes

Prepared by: _________________  Title: _________  Date: _________
```

## After corrections

1. Update `FINDINGS_TRACKER.csv` (`remediation_completed`, `initials_date_on_form`, `memo_attached`).
2. Note systemic patterns (e.g., many late Section 2s at one location) in `AUDIT_LOG.md`.
3. Schedule follow-up training if process findings recur.
