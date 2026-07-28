# I-9 Internal Audit Plan

## 1. Purpose

Ensure ongoing compliance with the employer sanctions provisions of the Immigration and Nationality Act by verifying that Forms I-9 are complete, accurate, and retained correctly — **without** targeting employees based on citizenship status, national origin, or protected activity.

## 2. Scope (complete before reviewing forms)

| Field | Value |
|-------|-------|
| Audit ID | I9-2026-001 |
| Engagement start | 2026-07-28 |
| Target completion | _TBD_ |
| Population | ☐ All current employees ☐ Neutral sample ☐ Current + terminated within retention window |
| Sample method (if sample) | e.g. every Nth hire by start date / random by employee ID — **must be citizenship- and national-origin-blind** |
| Locations / entities | _TBD_ |
| E-Verify enrolled? | ☐ Yes ☐ No ☐ Mixed |
| Audit lead | _TBD_ |
| Reviewers | _TBD_ |

### In scope

- Form I-9 presence for every in-scope worker
- Section 1 completeness and timely employee attestation
- Section 2 completeness, document recording, and 3-business-day rule
- Section 3 / Supplement B reverification and rehire entries where required
- Retention schedule compliance
- Consistent, non-discriminatory remediation

### Out of scope

- Re-examining original identity documents solely because of citizenship or national origin
- Requesting specific documents from List A/B/C beyond what the Form I-9 rules allow
- Using audit results to retaliate against any employee

## 3. Kickoff checklist

- [ ] Document purpose and scope in writing (this plan)
- [ ] Confirm neutral selection criteria if auditing a subset
- [ ] Pull active payroll roster (legal name, hire date, status, location)
- [ ] Pull terminated roster for employees still inside retention period
- [ ] Locate I-9 storage (paper / electronic / vendor system)
- [ ] Confirm which Form I-9 edition was valid at each hire date
- [ ] Brief reviewers on correction rules (no white-out, no backdating)
- [ ] Prepare employee communication template (if employees must complete/correct Section 1)
- [ ] Create working copy of `FINDINGS_TRACKER.csv`

## 4. Population reconciliation

1. Export payroll → unique employee key, legal name, first day of employment, termination date (if any).
2. Match each person to one Form I-9.
3. Flag: **Missing I-9**, **Duplicate I-9s**, **Name/hire-date mismatch**.
4. Enter every person as a row in `FINDINGS_TRACKER.csv` before deep review.

### Grandfather note

Employees hired on or before **November 6, 1986** who have been continuously employed may not require a Form I-9. Document any such exclusions in the tracker notes.

## 5. Review standards

Use `CHECKLIST.md` for each form. Classify each issue as:

| Class | Meaning | Typical action |
|-------|---------|----------------|
| Technical | Completeness / obvious omission that does not undermine verification | Correct on form; initial + date |
| Substantive | Missing form, missing sections, invalid documents recorded, late Section 2, etc. | Correct carefully; memo if new form needed |
| Process | Storage, retention, E-Verify timing, inconsistent practices | Fix process; train; note systemic risk |

## 6. Communication principles

- Tell employees **in writing** if they must help correct Section 1 or present documents for a missing/deficient form.
- Explain the audit is for compliance; do **not** specify which documents they must present (employee chooses from Lists A or B+C).
- Apply the same standards to every similarly situated employee.

## 7. Deliverables at close

- Completed `FINDINGS_TRACKER.csv`
- Summary counts in `AUDIT_LOG.md` (forms reviewed, missing, technical, substantive, remediated)
- Retention of audit workpapers with the I-9 files or HR compliance archive
