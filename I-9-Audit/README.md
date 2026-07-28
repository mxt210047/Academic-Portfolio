# Form I-9 Internal Audit Kit

Internal employment-eligibility verification audit package for reviewing Forms I-9 against ICE public guidance and USCIS Form I-9 requirements.

> **Not legal advice.** This kit operationalizes publicly available ICE employer guidance for internal audits. For complex cases, consult qualified immigration counsel.

## What’s included

| File | Purpose |
|------|---------|
| [AUDIT_PLAN.md](./AUDIT_PLAN.md) | Purpose, scope, neutral selection rules, and kickoff checklist |
| [CHECKLIST.md](./CHECKLIST.md) | Form-by-form review checklist (Sections 1–3, retention, E-Verify) |
| [FINDINGS_TRACKER.csv](./FINDINGS_TRACKER.csv) | Spreadsheet to log every form reviewed and every deficiency |
| [CORRECTION_GUIDE.md](./CORRECTION_GUIDE.md) | How to correct technical vs. substantive errors without backdating |
| [AUDIT_LOG.md](./AUDIT_LOG.md) | Running engagement log for this audit |

## How to run this audit

1. **Freeze scope** in `AUDIT_PLAN.md` (all forms vs. neutral sample).
2. **Export payroll** for active employees (and recently terminated, if in scope).
3. **Reconcile** every in-scope person to a Form I-9 on file.
4. **Review each form** with `CHECKLIST.md`; log rows in `FINDINGS_TRACKER.csv`.
5. **Remediate** using `CORRECTION_GUIDE.md`; record completion dates in the tracker.
6. **Close** the engagement in `AUDIT_LOG.md` with summary counts.

## Status

**Audit status:** In progress — kit initialized; form review not yet started (no employee Forms I-9 loaded in this repository).

## References

- [ICE Guidance for Employers Conducting Internal Form I-9 Audits](https://www.ice.gov/doclib/guidance/i9Guidance.pdf)
- [USCIS Form I-9](https://www.uscis.gov/i-9)
- [USCIS Handbook for Employers (M-274)](https://www.uscis.gov/i-9-central/form-i-9-resources/handbook-for-employers-m-274)
