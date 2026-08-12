using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

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
    analysis = "content-based",
    note = "Live Document Analysis runs in I-9-Assist-Agent (browser) against uploaded File bytes. This API mirrors content classification for integrations."
}))
.WithName("Health")
.WithOpenApi();

app.MapGet("/api/i9-assist/audit", () => Results.Ok(new
{
    status = "OPEN",
    populationLoaded = false,
    note = "Scaffold — upload documents to I-9-Assist-Agent UI for live content analysis."
}))
.WithName("GetAudit")
.WithOpenApi();

app.MapGet("/api/i9-assist/findings", () => Results.Ok(new
{
    note = "No fixture findings. POST /api/i9-assist/analyze-text with extracted document text, or use the Assist Agent UI.",
    findings = Array.Empty<object>()
}))
.WithName("GetFindings")
.WithOpenApi();

/// <summary>
/// Content-based classification of already-extracted document text.
/// Does not invent field values; returns uncertainty when text is empty.
/// </summary>
app.MapPost("/api/i9-assist/analyze-text", async (HttpRequest request) =>
{
    using var reader = new StreamReader(request.Body, Encoding.UTF8);
    var body = await reader.ReadToEndAsync();
    string text;
    string? documentName = null;
    try
    {
        using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(body) ? "{}" : body);
        text = doc.RootElement.TryGetProperty("text", out var t) ? t.GetString() ?? "" : body;
        if (doc.RootElement.TryGetProperty("documentName", out var n)) documentName = n.GetString();
    }
    catch
    {
        text = body;
    }

    text = text?.Trim() ?? "";
    if (text.Length < 8)
    {
        return Results.Ok(new
        {
            ok = false,
            classification = "unknown",
            uncertainty = "No extractable text provided. Human review required.",
            findings = new[]
            {
                new
                {
                    section = "Document Review",
                    title = "Unable to extract document text",
                    detail = "Request contained insufficient text for content analysis.",
                    @class = "substantive"
                }
            }
        });
    }

    var isI9 = Regex.IsMatch(text, @"employment\s+eligibility\s+verification|form\s*i-?9|uscis|omb\s+no\.?\s*1615-0047", RegexOptions.IgnoreCase);
    var isSupport = Regex.IsMatch(text, @"passport|driver'?s?\s+licen[cs]e|social\s+security|employment\s+authorization|permanent\s+resident", RegexOptions.IgnoreCase);
    var classification = isI9 ? "form_i9" : isSupport ? "supporting_id" : "other";
    var findings = new List<object>();
    if (!isI9 && !isSupport)
    {
        findings.Add(new
        {
            section = "Document Review",
            title = "Document content is not Form I-9",
            detail = $"Extracted text from {documentName ?? "document"} does not contain Form I-9 markers.",
            @class = "technical"
        });
    }
    if (isI9 && !Regex.IsMatch(text, @"last\s+name", RegexOptions.IgnoreCase))
    {
        findings.Add(new
        {
            section = "Section 1",
            title = "Employee name fields incomplete",
            detail = "Form I-9 markers present but last name not detected in text.",
            @class = "substantive"
        });
    }

    return Results.Ok(new
    {
        ok = true,
        classification,
        charCount = text.Length,
        documentName,
        findings
    });
})
.WithName("AnalyzeText")
.WithOpenApi();

app.Run();
