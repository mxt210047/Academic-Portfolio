# I-9 Audit Agent (OnBlick wireframe implementation)

Working AI-agent UI aligned to:

https://www.figma.com/proto/XUiscxnfzfvDdsiK9iHcsy/I-9-AI-Aduit?node-id=22-20594&starting-point-node-id=22%3A20594

ADO branch reference: `OnBlickMicroservices` / `I9_Audit_Agent_Mayukh`

## Architecture

```
I-9-Assist-Agent/
  index.html
  css/styles.css
  js/
    main.js                      # app wiring / workflow
    data/models.js               # audit/employee builders (no seeded catalogs)
    data/importedDocuments.js    # registry of uploaded docs + preview URLs
    state/store.js               # session state from imports only
    services/
      fileImport.js              # choose files / folder / drag-drop → packages
      intent.js
      promptBuilder.js
      aiAgent.js
    ui/
      documentView.js            # page to open/preview an imported document
      ...
```

## Data rules

- Starts empty — no mock employees, folders, or findings
- Roster comes only from imported files/folders
- Each upload is registered in `importedDocuments.js` and openable on the document page
- Findings stay empty until a real audit/parsing API attaches them

## Workflow

1. Empty state → **Import I-9 Documents**
2. Choose org + files/folder → **Save & Audit Later** or **Initiate Audit**
3. Confirm initiate → employee table from import structure
4. Click **Documents** (or a file name on Audit Notes) → document preview page
5. Open employee → Audit Notes + **OnBlick Audit Assistant**
6. Start correction / chat → Approve · Reject · Regenerate

## Run

```bash
cd I-9-Assist-Agent && python3 -m http.server 8765
# http://127.0.0.1:8765/
```

Or from repo root: `./START-I9-AUDIT.sh`
