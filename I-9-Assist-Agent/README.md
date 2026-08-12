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
    main.js                      # wires UI; reads/writes import data via mockData.js
    data/mockData.js             # LIVE store of imported packages + documents (starts empty)
    data/models.js               # builds audits from mockData packages
    data/importedDocuments.js    # thin re-export of mockData document helpers
    state/store.js
    services/
      fileImport.js              # FileList → package/employee/document structure
      intent.js
      promptBuilder.js
      aiAgent.js
    ui/
      documentView.js            # open/preview an imported document
      ...
```

## Data rules

- `mockData.js` starts empty — no seeded employees, folders, or findings
- Choose files / folder / drag-drop writes into `mockData.js`
- `main.js` builds audits and opens documents from that live import data only

## Workflow

1. Empty state → **Import I-9 Documents**
2. Choose org + your files/folder → **Save & Audit Later** or **Initiate Audit**
3. Confirm initiate → employee table from import structure
4. Click **Documents** (or a file name on Audit Notes) → document preview page
5. Open employee → Audit Notes + **OnBlick Audit Assistant**

After **YES, CONFIRM**, local analysis runs over the imported packet:
employee rows move from Pending/Analyzing → **Errors Found** or **No Errors Found**,
and the audit status becomes **Completed**.

## Run

```bash
cd I-9-Assist-Agent && python3 -m http.server 8765
# http://127.0.0.1:8765/
```

Or from repo root: `./START-I9-AUDIT.sh`
