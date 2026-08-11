# I9Audit (I-9 Assist Audit Agent)

Opened from `I9Audit.sln` at:

`OnBlickMicroservices/src/API/Services/OpenAI/I9Audit/`

Correlated with:

- Figma: https://www.figma.com/proto/XUiscxnfzfvDdsiK9iHcsy/I-9-AI-Aduit?node-id=22-20594&starting-point-node-id=22%3A20594
- ADO branch: `I9_Audit_Agent` on OnBlickMicroservices

## Run

```bash
./START.sh
# or: START-I9-AUDIT.bat / START-I9-AUDIT.sh from repo root
```

- Swagger: http://127.0.0.1:5089/swagger
- Health: http://127.0.0.1:5089/api/i9-assist/health

> This folder currently contains a scaffold so the uploaded `.sln` can open/build. Drop in the real `I9Audit` sources from Azure DevOps to replace it.
