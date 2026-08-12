using I9Audit.Models;

namespace I9Audit.Services;

/// <summary>
/// Rule-based I-9 validation over extracted form content (no invented field values).
/// </summary>
public class I9RuleEngineService
{
    public I9ValidationResult Validate(I9FormDetails form, string sourceFileName)
    {
        var findings = new List<ValidationFinding>();
        var s1 = form.Section1;
        var s2 = form.Section2;

        if (s1 == null && s2 == null)
        {
            findings.Add(Finding("SYSTEM", "Extraction", "Error", "Minimum data",
                "No Section 1 or Section 2 data was extracted. Validation was skipped.",
                recommendation: "Re-scan or upload a clearer Form I-9 with selectable text, then re-run the audit.",
                documentName: sourceFileName));
            return new I9ValidationResult { Findings = findings };
        }

        if (s1 != null)
        {
            if (Blank(s1.LastName) || Blank(s1.FirstName))
                findings.Add(Finding("Section 1", "employeeName", "Error", "S1-Name",
                    "Employee first and/or last name was not detected in extracted Section 1 content.",
                    detected: Join(s1.FirstName, s1.LastName),
                    recommendation: "Only the employee may correct Section 1 name fields; initial and date with today's date (never backdate).",
                    documentName: sourceFileName));

            if (Blank(s1.DateOfBirth))
                findings.Add(Finding("Section 1", "dateOfBirth", "Warning", "S1-DOB",
                    "Date of birth was not detected in Section 1.",
                    recommendation: "Employee completes Date of Birth if blank; initial and date the correction.",
                    documentName: sourceFileName));

            if (Blank(s1.CitizenshipStatus))
                findings.Add(Finding("Section 1", "citizenship", "Error", "S1-Attestation",
                    "Citizenship / immigration attestation was not detected in Section 1.",
                    recommendation: "Employee must select the correct attestation box in Section 1.",
                    documentName: sourceFileName));

            if (!s1.EmployeeSignaturePresent)
                findings.Add(Finding("Section 1", "employeeSignature", "Error", "S1-Signature",
                    "Employee signature was not detected in Section 1.",
                    recommendation: "Employee must sign and date Section 1.",
                    documentName: sourceFileName));

            if (Blank(s1.EmployeeSignatureDate))
                findings.Add(Finding("Section 1", "employeeSignatureDate", "Warning", "S1-SignDate",
                    "Employee signature date was not detected.",
                    recommendation: "Employee enters the actual date of signing; never backdate.",
                    documentName: sourceFileName));
        }

        if (s2 != null)
        {
            if (Blank(s2.DocumentTitle) && Blank(s2.DocumentNumber))
                findings.Add(Finding("Section 2", "documentTitle", "Error", "S2-Docs",
                    "Neither document title nor document number was detected in Section 2.",
                    recommendation: "Employer records List A or List B+C document title, issuing authority, number, and expiration.",
                    documentName: sourceFileName));

            if (Blank(s2.FirstDayOfEmployment))
                findings.Add(Finding("Section 2", "firstDayOfEmployment", "Warning", "S2-Start",
                    "First day of employment was not detected in Section 2.",
                    recommendation: "Employer enters the employee's first day of employment in Section 2.",
                    documentName: sourceFileName));

            if (!s2.EmployerSignaturePresent)
                findings.Add(Finding("Section 2", "employerSignature", "Error", "S2-Signature",
                    "Employer / authorized representative signature was not detected in Section 2.",
                    recommendation: "Employer or authorized representative must sign and date Section 2 after examining documents.",
                    documentName: sourceFileName));
        }
        else if (s1 != null)
        {
            findings.Add(Finding("Section 2", "section2", "Error", "S2-Missing",
                "Section 1 content was extracted but Section 2 employer verification was not found.",
                recommendation: "Employer must complete Section 2 within 3 business days of the hire date.",
                documentName: sourceFileName));
        }

        if (form.SupportingDocuments.Count == 0 && s2 != null && Blank(s2.DocumentTitle))
        {
            findings.Add(Finding("Section 2", "supportingDocuments", "Warning", "S2-Support",
                "No supporting identity document content was identified in the packet alongside incomplete Section 2 document fields.",
                recommendation: "Retain copies of List A or List B+C documents examined and complete Section 2 from those documents.",
                documentName: sourceFileName));
        }

        return new I9ValidationResult { Findings = findings };
    }

    public object AssessEVerifyReadiness(I9FormDetails form) => new
    {
        ready = form.Section1 != null && form.Section2 != null &&
                !Blank(form.Section1.LastName) && !Blank(form.Section2.DocumentNumber),
        note = "Heuristic readiness based on extracted fields only."
    };

    public object BuildRemediation(I9ValidationResult validation, string baseUrl) => new
    {
        openFindings = validation.Findings.Count,
        steps = validation.Findings.Select(f => f.Recommendation ?? f.Message).ToList(),
        assistUrl = baseUrl
    };

    static bool Blank(string? v) => string.IsNullOrWhiteSpace(v);
    static string? Join(params string?[] parts)
    {
        var s = string.Join(" ", parts.Where(p => !string.IsNullOrWhiteSpace(p)));
        return string.IsNullOrWhiteSpace(s) ? null : s;
    }

    static ValidationFinding Finding(
        string section, string field, string severity, string rule, string message,
        string? detected = null, string? recommendation = null, string? documentName = null) =>
        new()
        {
            Section = section,
            Field = field,
            Severity = severity,
            Rule = rule,
            Message = message,
            DetectedValue = detected,
            Recommendation = recommendation,
            DocumentName = documentName
        };
}

/// <summary>
/// Optional external Parsing microservice client. No-ops when BaseUrl is unset.
/// </summary>
public class ParsingAuditClient
{
    private readonly I9Audit.Configuration.ParsingOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ParsingAuditClient> _logger;

    public ParsingAuditClient(
        Microsoft.Extensions.Options.IOptions<I9Audit.Configuration.ParsingOptions> options,
        IHttpClientFactory httpClientFactory,
        ILogger<ParsingAuditClient> logger)
    {
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.BaseUrl);

    public Task<object?> ParseAsync(IFormFile pdfFile, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured) return Task.FromResult<object?>(null);
        _logger.LogInformation("Parsing integration configured at {Url} but mapper not connected in this scaffold; falling back.", _options.BaseUrl);
        return Task.FromResult<object?>(null);
    }
}

public static class ParsingResultMapper
{
    public static I9AuditPipelineResult ToPipelineResult(object parsingResult, string fileName) =>
        throw new NotSupportedException("External Parsing result mapping requires OnBlick Parsing contracts.");
}

public class PiiScrubber
{
    public static string Scrub(string? value) =>
        string.IsNullOrEmpty(value) ? "" : RegexReplace(value);

    static string RegexReplace(string value) =>
        System.Text.RegularExpressions.Regex.Replace(value, @"\d{3}-\d{2}-\d{4}", "***-**-****");
}
