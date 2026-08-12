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
            findings.Add(Finding(
                "Document Review", "extraction", "Error", "Unable to extract Section 1/2",
                "No Section 1 or Section 2 data was extracted from the live document. Manual review is required.",
                recommendation: "Re-scan or upload a clearer Form I-9 with selectable text, then re-run the audit.",
                documentName: sourceFileName,
                className: "substantive"));
            return new I9ValidationResult { Findings = findings };
        }

        if (s1 != null)
        {
            if (Blank(s1.LastName) || Blank(s1.FirstName))
                findings.Add(Finding(
                    "Section 1", "employeeName", "Error", "Employee name incomplete",
                    "Required employee first and/or last name was not detected as a completed value in Section 1.",
                    detected: Join(s1.FirstName, s1.LastName),
                    recommendation: "Only the employee may correct Section 1 name fields; use N/A for unused middle initial; initial and date with today's date (never backdate).",
                    documentName: sourceFileName,
                    className: "substantive"));

            if (Blank(s1.Address))
                findings.Add(Finding(
                    "Section 1", "address", "Warning", "Employee address missing",
                    "Street address was not detected as a completed value in Section 1.",
                    recommendation: "Employee completes address fields in Section 1 if blank; initial and date corrections.",
                    documentName: sourceFileName,
                    className: "technical"));

            if (Blank(s1.DateOfBirth))
                findings.Add(Finding(
                    "Section 1", "dateOfBirth", "Error", "Date of birth missing",
                    "Date of birth was not detected in Section 1.",
                    recommendation: "Employee completes Date of Birth if blank; initial and date the correction.",
                    documentName: sourceFileName,
                    className: "substantive"));

            if (Blank(s1.CitizenshipStatus))
                findings.Add(Finding(
                    "Section 1", "citizenship", "Error", "Citizenship attestation missing",
                    "A completed citizenship/immigration attestation selection was not detected in Section 1.",
                    recommendation: "Employee must select exactly one attestation box in Section 1.",
                    documentName: sourceFileName,
                    className: "substantive"));

            if (!s1.EmployeeSignaturePresent)
                findings.Add(Finding(
                    "Section 1", "employeeSignature", "Error", "Employee signature missing",
                    "A completed employee signature was not detected in Section 1 (label text alone is insufficient).",
                    recommendation: "Employee must sign and date Section 1.",
                    documentName: sourceFileName,
                    className: "substantive"));

            if (Blank(s1.EmployeeSignatureDate))
                findings.Add(Finding(
                    "Section 1", "employeeSignatureDate", "Error", "Employee signature date missing",
                    "Employee signature date (mm/dd/yyyy) was not detected.",
                    recommendation: "Employee enters the actual date of signing; never backdate.",
                    documentName: sourceFileName,
                    className: "technical"));
        }

        if (s2 != null)
        {
            if (Blank(s2.DocumentTitle))
                findings.Add(Finding(
                    "Section 2", "documentTitle", "Error", "Document title missing",
                    "List A/B/C document title was not detected as a completed value in Section 2.",
                    recommendation: "Employer records the document title from the List A or List B+C document presented.",
                    documentName: sourceFileName,
                    className: "substantive"));

            if (Blank(s2.IssuingAuthority))
                findings.Add(Finding(
                    "Section 2", "issuingAuthority", "Error", "Issuing authority missing",
                    "Issuing authority was not detected in Section 2.",
                    recommendation: "Employer records the issuing authority from the document examined.",
                    documentName: sourceFileName,
                    className: "substantive"));

            if (Blank(s2.DocumentNumber))
                findings.Add(Finding(
                    "Section 2", "documentNumber", "Error", "Document number missing",
                    "Document number was not detected in Section 2.",
                    recommendation: "Employer records the document number from the document examined.",
                    documentName: sourceFileName,
                    className: "substantive"));

            if (Blank(s2.ExpirationDate))
                findings.Add(Finding(
                    "Section 2", "expirationDate", "Warning", "Expiration date missing",
                    "Document expiration date was not detected (enter N/A when the document does not expire).",
                    recommendation: "Employer enters expiration date or N/A as applicable.",
                    documentName: sourceFileName,
                    className: "technical"));

            if (Blank(s2.FirstDayOfEmployment))
                findings.Add(Finding(
                    "Section 2", "firstDayOfEmployment", "Error", "First day of employment missing",
                    "First day of employment was not detected in Section 2.",
                    recommendation: "Employer enters the employee's first day of employment in Section 2.",
                    documentName: sourceFileName,
                    className: "substantive"));

            if (!s2.EmployerSignaturePresent)
                findings.Add(Finding(
                    "Section 2", "employerSignature", "Error", "Employer signature missing",
                    "A completed employer/authorized representative signature was not detected in Section 2.",
                    recommendation: "Employer or authorized representative must sign and date Section 2 after examining documents.",
                    documentName: sourceFileName,
                    className: "substantive"));

            if (Blank(s2.DateOfEmployerSignature))
                findings.Add(Finding(
                    "Section 2", "employerSignatureDate", "Warning", "Employer certification date missing",
                    "Employer certification date was not detected in Section 2.",
                    recommendation: "Employer dates the certification with the actual date of signing.",
                    documentName: sourceFileName,
                    className: "technical"));
        }
        else if (s1 != null)
        {
            findings.Add(Finding(
                "Section 2", "section2", "Error", "Section 2 missing",
                "Section 1 content was extracted but Section 2 employer verification was not found.",
                recommendation: "Employer must complete Section 2 within 3 business days of the hire date.",
                documentName: sourceFileName,
                className: "substantive"));
        }

        foreach (var s3 in form.Section3)
        {
            if (Blank(s3.RehireDate))
                findings.Add(Finding(
                    "Section 2", "reverification", "Warning", "Reverification/rehire incomplete",
                    "Section 3 / reverification content was detected but rehire date was not found.",
                    recommendation: "Complete Supplement B / Section 3 fields, signature, and date when reverifying or rehiring.",
                    documentName: sourceFileName,
                    className: "technical"));
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
        string section, string field, string severity, string title, string message,
        string? detected = null, string? recommendation = null, string? documentName = null,
        string? className = null) =>
        new()
        {
            Section = section,
            Field = field,
            Severity = severity,
            Rule = title, // human-readable title for Document Analysis
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
    private readonly ILogger<ParsingAuditClient> _logger;

    public ParsingAuditClient(
        Microsoft.Extensions.Options.IOptions<I9Audit.Configuration.ParsingOptions> options,
        ILogger<ParsingAuditClient> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.BaseUrl);

    public Task<object?> ParseAsync(IFormFile pdfFile, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured) return Task.FromResult<object?>(null);
        _logger.LogInformation("Parsing integration configured at {Url}; falling back to local pipeline in this build.", _options.BaseUrl);
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
        string.IsNullOrEmpty(value) ? "" : System.Text.RegularExpressions.Regex.Replace(value, @"\d{3}-\d{2}-\d{4}", "***-**-****");
}
