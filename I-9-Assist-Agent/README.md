# I-9 Assist Audit Agent

Local assist UI for Audit ID **I9-2026-001**, correlated with:

- Figma: [I-9 AI Audit wireframe](https://www.figma.com/proto/XUiscxnfzfvDdsiK9iHcsy/I-9-AI-Aduit?node-id=22-20594&starting-point-node-id=22%3A20594)
- Azure DevOps: [OnBlickMicroservices @ `I9_Audit_Agent`](https://onblickrigaps.visualstudio.com/_git/OnBlickMicroservices?path=%2F&version=GBI9_Audit_Agent&_a=contents)

## Open locally

From repo root (preferred):

```bash
./START-I9-AUDIT.sh
```

Or:

```bash
cd I-9-Assist-Agent
python3 -m http.server 8765
```

Then open: http://127.0.0.1:8765/i9-assist-audit-agent.html

## Windows / OnBlick production launcher

`START-I9-AUDIT.bat` at the repo root delegates to:

`OnBlickMicroservices\src\API\Services\OpenAI\I9Audit\START.bat`

That path comes from Azure DevOps branch `I9_Audit_Agent`. Clone that repo beside this kit, then run the `.bat` on Windows.