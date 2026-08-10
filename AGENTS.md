# AGENTS.md

## Cursor Cloud specific instructions

This repository is **not a runnable software product**. It is a UT Dallas undergraduate portfolio whose featured package is the **Form I-9 Internal Audit Kit** under `I-9-Audit/`. There are no package managers, Docker services, tests, or lint targets.

### Relevant “service”

| Item | Role | How to use |
|------|------|------------|
| **I-9 Audit kit** (`I-9-Audit/`) | Internal Form I-9 compliance audit package (Audit ID `I9-2026-001`) | Follow `I-9-Audit/README.md` — freeze scope in `AUDIT_PLAN.md`, review with `CHECKLIST.md`, log in `FINDINGS_TRACKER.csv`, remediate with `CORRECTION_GUIDE.md`, close in `AUDIT_LOG.md` |

### I-9 assist audit agent

When asked to open or run the “i9 assist audit agent,” treat the Cursor agent as the assist layer over this kit:

1. Read `I-9-Audit/README.md` and current `AUDIT_LOG.md` status.
2. Confirm scope fields in `AUDIT_PLAN.md` (do not invent employer facts).
3. Assist form review against `CHECKLIST.md`; append rows to `FINDINGS_TRACKER.csv`.
4. Propose remediation steps from `CORRECTION_GUIDE.md` (never backdate; never white-out).
5. Update `AUDIT_LOG.md` timeline and close-out metrics.

### Critical constraints

- **No PII in-repo:** Do not store real employee Forms I-9, SSN, documents, or payroll exports here. Keep those in the HR system of record; reference employees by opaque IDs only if logging is required.
- **Not legal advice:** Point users to ICE/USCIS public guidance and qualified counsel for complex cases (links in `I-9-Audit/README.md`).
- **Lint / test / build:** None exist. Do not invent CI. Validate work by reviewing Markdown/CSV consistency and checklist completeness.
- **Dependencies:** None. The VM update script is a no-op (`true`).
