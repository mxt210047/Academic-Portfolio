# I-9 Audit Agent (OnBlick wireframe)

Interactive UI matching the Figma flow **OnBlick I-9 Audit Agent**:

https://www.figma.com/proto/XUiscxnfzfvDdsiK9iHcsy/I-9-AI-Aduit?node-id=22-20594&starting-point-node-id=22%3A20594

## Screens

1. Empty state — **No Documents Found!** + **IMPORT I-9 DOCUMENTS**
2. Import modal — org name, upload dropzone, selected folders, **SAVE & AUDIT LATER** / **INITIATE AUDIT**
3. Audits list — Schinner LLC row + **INITIATE AUDIT**
4. Confirm modal — **YES, CONFIRM**
5. View audit — employee error badges
6. **AI Assist Agent** — audit notes editor + OnBlick Audit Assistant chat / **Start Correction Recommendation**

## Run

```bash
./START-I9-AUDIT.sh
# or
cd I-9-Assist-Agent && python3 -m http.server 8765
```

Open: http://127.0.0.1:8765/

Wireframe captures: `/opt/cursor/artifacts/figma/`
