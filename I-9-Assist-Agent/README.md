# I-9 Audit Agent (OnBlick wireframe implementation)

Working AI-agent UI aligned to:

https://www.figma.com/proto/XUiscxnfzfvDdsiK9iHcsy/I-9-AI-Aduit?node-id=22-20594&starting-point-node-id=22%3A20594

ADO branch reference: `OnBlickMicroservices` / `I9_Audit_Agent`

## Architecture

```
I-9-Assist-Agent/
  index.html
  css/styles.css
  js/
    main.js                 # app wiring / workflow
    data/mockData.js        # fictional records (not wireframe samples)
    state/store.js          # session state
    services/
      intent.js             # intent detection
      promptBuilder.js      # prompt payload for future LLM API
      aiAgent.js            # mock AI service + statuses
    ui/                     # presentational screens
    utils/dom.js
```

## Workflow

1. Empty state → **Import I-9 Documents**
2. Choose org + folders → **Save & Audit Later** or **Initiate Audit**
3. Confirm initiate → employee results table
4. Open employee → Audit Notes + **OnBlick Audit Assistant**
5. Start correction / chat → Approve · Reject · Regenerate

## Run

```bash
cd I-9-Assist-Agent && python3 -m http.server 8765
# http://127.0.0.1:8765/
```

Or from repo root: `./START-I9-AUDIT.sh`
