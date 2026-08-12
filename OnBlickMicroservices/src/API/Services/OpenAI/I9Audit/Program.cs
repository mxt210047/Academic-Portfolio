using I9Audit.Configuration;
using I9Audit.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<PlatformOptions>(builder.Configuration.GetSection(PlatformOptions.SectionName));
builder.Services.Configure<ParsingOptions>(builder.Configuration.GetSection(ParsingOptions.SectionName));

builder.Services.AddHttpClient();
builder.Services.AddSingleton<PdfTextExtractService>();
builder.Services.AddSingleton<TextPageClassifierService>();
builder.Services.AddSingleton<TextFieldExtractorService>();
builder.Services.AddSingleton<I9RuleEngineService>();
builder.Services.AddSingleton<ParsingAuditClient>();
builder.Services.AddScoped<I9AuditService>();

builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p =>
        p.WithOrigins("http://127.0.0.1:8765", "http://localhost:8765")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "I-9 Assist Audit Agent", Version = "v1" });
});

var app = builder.Build();

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/", () => Results.Redirect("/swagger"));

app.MapGet("/api/i9-assist/health", (IConfiguration config) => Results.Ok(new
{
    service = "I-9 Assist Audit Agent",
    status = "OPEN",
    analysis = "I9AuditService pipeline (Parsing → vision/local-text → rules)",
    localTextPipeline = config.GetValue("Parsing:EnableLocalTextPipeline", true),
    note = "POST /api/i9-assist/audit/extract with multipart file field 'file' to audit a live PDF."
}))
.WithName("Health")
.WithOpenApi();

app.MapGet("/api/i9-assist/audit", () => Results.Ok(new
{
    status = "OPEN",
    populationLoaded = false,
    note = "Use POST /api/i9-assist/audit/extract for live document audit. No fixture findings are returned."
}))
.WithName("GetAudit")
.WithOpenApi();

app.MapGet("/api/i9-assist/findings", () => Results.Ok(new
{
    note = "No fixture findings. Audit live documents via POST /api/i9-assist/audit/extract.",
    findings = Array.Empty<object>()
}))
.WithName("GetFindings")
.WithOpenApi();

/// <summary>
/// Live document audit: upload PDF → I9AuditService pipeline → structured findings.
/// </summary>
app.MapPost("/api/i9-assist/audit/extract", async (HttpRequest request, I9AuditService auditService, CancellationToken ct) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest(new { error = "Expected multipart/form-data with a PDF file field named 'file'." });

    var form = await request.ReadFormAsync(ct);
    var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No file uploaded." });

    var result = await auditService.ExtractAsync(file, ct);
    return Results.Ok(result);
})
.DisableAntiforgery()
.WithName("ExtractAudit")
.WithOpenApi();

app.MapPost("/api/i9-assist/analyze-text", async (HttpRequest request, TextPageClassifierService classifier, TextFieldExtractorService extractor, I9RuleEngineService rules) =>
{
    using var reader = new StreamReader(request.Body);
    var body = await reader.ReadToEndAsync();
    string text;
    string? documentName = null;
    try
    {
        using var doc = System.Text.Json.JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
        text = doc.RootElement.TryGetProperty("text", out var t) ? t.GetString() ?? "" : body;
        if (doc.RootElement.TryGetProperty("documentName", out var n)) documentName = n.GetString();
    }
    catch
    {
        text = body;
    }

    text = (text ?? "").Trim();
    var label = classifier.Classify(text);
    var form = new I9Audit.Models.I9FormDetails();
    if (label is "Section1" or "Section1And2") form.Section1 = extractor.ExtractSection1(text);
    if (label is "Section2" or "Section1And2") form.Section2 = extractor.ExtractSection2(text);
    if (label == "SupportingDocument")
    {
        var s = extractor.ExtractSupportingDocument(text);
        if (s != null) form.SupportingDocuments.Add(s);
    }
    var validation = rules.Validate(form, documentName ?? "document");
    return Results.Ok(new
    {
        ok = text.Length >= 8,
        classification = label,
        charCount = text.Length,
        documentName,
        findings = validation.Findings
    });
})
.WithName("AnalyzeText")
.WithOpenApi();

app.Run();
