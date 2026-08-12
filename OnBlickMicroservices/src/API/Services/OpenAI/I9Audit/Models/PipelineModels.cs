namespace I9Audit.Models;

public class ValidationFinding
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Section { get; set; } = "";
    public string Field { get; set; } = "";
    public string Severity { get; set; } = "Error"; // Error | Warning | Info
    public string Rule { get; set; } = "";
    public string Message { get; set; } = "";
    public string? DetectedValue { get; set; }
    public string? Recommendation { get; set; }
    public string? DocumentName { get; set; }
    public int? PageNumber { get; set; }
}

public class I9ValidationResult
{
    public List<ValidationFinding> Findings { get; set; } = new();
}

public class Section1Dto
{
    public string? LastName { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleInitial { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Zip { get; set; }
    public string? DateOfBirth { get; set; }
    public string? Ssn { get; set; }
    public string? CitizenshipStatus { get; set; }
    public bool EmployeeSignaturePresent { get; set; }
    public string? EmployeeSignatureDate { get; set; }
    public string? EmployeeFirstDayOfEmployment { get; set; }
}

public class Section2Dto
{
    public string? DocumentTitle { get; set; }
    public string? IssuingAuthority { get; set; }
    public string? DocumentNumber { get; set; }
    public string? ExpirationDate { get; set; }
    public string? FirstDayOfEmployment { get; set; }
    public bool EmployerSignaturePresent { get; set; }
    public string? DateOfEmployerSignature { get; set; }
    public string? EmployerName { get; set; }
}

public class Section3Dto
{
    public string? RehireDate { get; set; }
    public string? Section2CompletionDate { get; set; }
}

public class SupportingDocumentDto
{
    public string? DocumentType { get; set; }
    public string? DocumentNumber { get; set; }
    public string? ExpirationDate { get; set; }
    public string? IssuingAuthority { get; set; }
}

public class I9FormDetails
{
    public Section1Dto? Section1 { get; set; }
    public Section2Dto? Section2 { get; set; }
    public List<Section3Dto> Section3 { get; set; } = new();
    public List<SupportingDocumentDto> SupportingDocuments { get; set; } = new();
}

public class I9ExtractionResult
{
    public Section1Dto? Section1 { get; set; }
    public Section2Dto? Section2 { get; set; }
    public List<Section3Dto> Section3List { get; set; } = new();
    public int SupportingDocumentsCount { get; set; }
    public int IgnoredPagesCount { get; set; }
    public string? ExtractedTextPreview { get; set; }
    public string ExtractionMethod { get; set; } = "local-text";
}

public class PageClassificationSummary
{
    public int PageNumber { get; set; }
    public string Label { get; set; } = "Ignore";
    public bool Processed { get; set; }
}

public class I9AuditPipelineResult
{
    public string AuditId { get; set; } = $"I9-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6]}";
    public string SourceFileName { get; set; } = "";
    public I9ExtractionResult Extraction { get; set; } = new();
    public List<PageClassificationSummary> PageSummary { get; set; } = new();
    public I9ValidationResult Validation { get; set; } = new();
    public string ValidationStatus { get; set; } = "Pending";
    public string? ValidationMethod { get; set; }
    public bool IsCompliant =>
        ValidationStatus == "Complete" &&
        !Validation.Findings.Any(f => f.Severity.Equals("Error", StringComparison.OrdinalIgnoreCase));
    public object? EVerifyReadiness { get; set; }
    public object? Remediation { get; set; }
}
