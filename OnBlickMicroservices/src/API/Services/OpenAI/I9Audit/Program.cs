var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "I-9 Assist Audit Agent", Version = "v1" });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Redirect("/swagger"));

app.MapGet("/api/i9-assist/health", () => Results.Ok(new
{
    service = "I-9 Assist Audit Agent",
    status = "OPEN",
    auditId = "I9-2026-001",
    branchHint = "I9_Audit_Agent",
    figma = "https://www.figma.com/proto/XUiscxnfzfvDdsiK9iHcsy/I-9-AI-Aduit?node-id=22-20594&starting-point-node-id=22%3A20594"
}))
.WithName("Health")
.WithOpenApi();

app.MapGet("/api/i9-assist/audit", () => Results.Ok(new
{
    auditId = "I9-2026-001",
    status = "OPEN",
    kitPath = "I-9-Audit/",
    populationLoaded = false,
    note = "Scaffold opened from I9Audit.sln — replace with OnBlickMicroservices I9_Audit_Agent sources when ADO access is available."
}))
.WithName("GetAudit")
.WithOpenApi();

app.MapGet("/api/i9-assist/findings", () => Results.Ok(new[]
{
    new
    {
        employeeId = "EXAMPLE-001",
        findingClass = "Technical",
        findingCodes = "S1-DATE",
        findingDetail = "Section 1 date blank",
        remediationCompleted = false
    }
}))
.WithName("GetFindings")
.WithOpenApi();

app.Run();
