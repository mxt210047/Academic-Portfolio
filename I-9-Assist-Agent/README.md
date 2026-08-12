# I-9 Assist / Audit Agent (Figma-aligned UI)

Static modular UI for the OnBlick I-9 Audit Agent workflow.

## Run

```bash
# from repo root
./START-I9-AUDIT.sh
# → http://127.0.0.1:8765/
```

## Architecture

```
js/
  main.js                        # wires UI + import → analysis workflow
  services/
    documentStore.js             # LIVE File registry (production source of truth)
    documentExtract.js           # PDF/text/DOCX content extraction (pdf.js)
    i9ContentAnalysis.js         # content-based I-9 field rules
    auditAnalysis.js             # orchestrates extract → analyze → complete findings
    fileImport.js                # FileList → packages/employees
    aiAgent.js                   # assist chat over live findings
  data/
    mockData.js                  # compatibility re-export of documentStore only
    models.js                    # audit/roster builders
  ui/                            # Figma-aligned screens
vendor/
  pdf.min.mjs / pdf.worker.min.mjs
```

## Data rules

- **Figma** = UI / workflow only — never application data
- **Live uploads** = analysis input (actual File bytes)
- **Content extraction** = primary audit engine (not filenames)
- Filename may appear as a supplementary note when extraction fails; it is never proof of Form I-9 contents

## Verify

```bash
python3 I-9-Assist-Agent/scripts/verify-content-analysis.py
```
