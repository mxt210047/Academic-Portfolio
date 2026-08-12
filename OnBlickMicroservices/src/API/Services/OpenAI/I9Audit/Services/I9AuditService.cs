using I9Audit.Configuration;
using I9Audit.Models;
using Microsoft.Extensions.Options;

namespace I9Audit.Services;

/// <summary>
/// Full pipeline: PDF → extract/classify → validate (rules + optional external Parsing/LLM).
/// Mirrors OnBlick I9AuditService architecture. When vision/Azure/Parsing are not configured,
/// uses local PDF text extraction + content rules so Document Analysis still audits live files.
/// </summary>
public class I9AuditService
{
    private readonly PdfTextExtractService _pdfText;
    private readonly TextPageClassifierService _classifier;
    private readonly TextFieldExtractorService _extractor;
    private readonly I9RuleEngineService _rules;
    private readonly PlatformOptions _platform;
    private readonly ParsingOptions _parsingOptions;
    private readonly ParsingAuditClient _parsingClient;
    private readonly ILogger<I9AuditService> _logger;

    public I9AuditService(
        PdfTextExtractService pdfText,
        TextPageClassifierService classifier,
        TextFieldExtractorService extractor,
        I9RuleEngineService rules,
        ParsingAuditClient parsingClient,
        IOptions<PlatformOptions> platform,
        IOptions<ParsingOptions> parsingOptions,
        ILogger<I9AuditService> logger)
    {
        _pdfText = pdfText;
        _classifier = classifier;
        _extractor = extractor;
        _rules = rules;
        _parsingClient = parsingClient;
        _platform = platform.Value;
        _parsingOptions = parsingOptions.Value;
        _logger = logger;
    }

    public async Task<I9AuditPipelineResult> ExtractAsync(IFormFile pdfFile, CancellationToken cancellationToken = default)
    {
        if (_parsingClient.IsConfigured)
        {
            try
            {
                var parsingResult = await _parsingClient.ParseAsync(pdfFile, cancellationToken);
                if (parsingResult != null)
                {
                    var mapped = ParsingResultMapper.ToPipelineResult(parsingResult, pdfFile.FileName);
                    _logger.LogInformation(
                        "Audit {AuditId} completed via Parsing integration ({Findings} findings)",
                        mapped.AuditId,
                        mapped.Validation.Findings.Count);
                    return mapped;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Parsing integration failed for {File}", PiiScrubber.Scrub(pdfFile.FileName));
                if (!_parsingOptions.FallbackToVisionPipeline && !_parsingOptions.EnableLocalTextPipeline)
                    throw;
            }
        }

        // Vision/Azure image pipeline is not configured in this environment — local text path.
        if (_parsingOptions.EnableLocalTextPipeline)
            return await ExtractWithLocalTextPipelineAsync(pdfFile, cancellationToken);

        return new I9AuditPipelineResult
        {
            SourceFileName = pdfFile.FileName,
            ValidationStatus = "Failed",
            Validation = new I9ValidationResult
            {
                Findings =
                {
                    new ValidationFinding
                    {
                        Section = "SYSTEM",
                        Field = "Pipeline",
                        Severity = "Error",
                        Rule = "Configuration",
                        Message = "No Parsing, vision, or local text pipeline is enabled.",
                        DocumentName = pdfFile.FileName,
                        Recommendation = "Enable Parsing:EnableLocalTextPipeline or configure Parsing:BaseUrl / vision services."
                    }
                }
            }
        };
    }

    async Task<I9AuditPipelineResult> ExtractWithLocalTextPipelineAsync(IFormFile pdfFile, CancellationToken cancellationToken)
    {
        await using var stream = pdfFile.OpenReadStream();
        var (text, pageCount) = _pdfText.Extract(stream, pdfFile.FileName);
        _logger.LogInformation(
            "Local text pipeline for {File}: pages={Pages}, chars={Chars}",
            PiiScrubber.Scrub(pdfFile.FileName), pageCount, text.Length);

        Section1Dto? section1 = null;
        Section2Dto? section2 = null;
        var section3List = new List<Section3Dto>();
        var supportingDocs = new List<SupportingDocumentDto>();
        var pageSummary = new List<PageClassificationSummary>();
        var ignoredCount = 0;

        var label = _classifier.Classify(text);
        var summary = new PageClassificationSummary { PageNumber = 1, Label = label };

        if (string.IsNullOrWhiteSpace(text) || text.Length < 8)
        {
            summary.Label = "Ignore";
            ignoredCount++;
            pageSummary.Add(summary);
            var empty = new I9AuditPipelineResult
            {
                SourceFileName = pdfFile.FileName,
                Extraction = new I9ExtractionResult
                {
                    IgnoredPagesCount = ignoredCount,
                    ExtractedTextPreview = "",
                    ExtractionMethod = "local-text"
                },
                PageSummary = pageSummary,
                ValidationStatus = "Skipped",
                ValidationMethod = "local-rules",
                Validation = new I9ValidationResult
                {
                    Findings =
                    {
                        new ValidationFinding
                        {
                            Section = "Document Review",
                            Field = "extraction",
                            Severity = "Error",
                            Rule = "Text extraction",
                            Message = "Could not extract readable text from the live PDF. Automated field checks were not performed. Human review is required.",
                            DocumentName = pdfFile.FileName,
                            Recommendation = "Re-export/re-scan with selectable text, or complete a manual Form I-9 review."
                        }
                    }
                }
            };
            return empty;
        }

        try
        {
            switch (label)
            {
                case "Section1":
                    section1 = _extractor.ExtractSection1(text);
                    summary.Processed = true;
                    break;
                case "Section2":
                    section2 = _extractor.ExtractSection2(text);
                    summary.Processed = true;
                    break;
                case "Section1And2":
                    section1 = _extractor.ExtractSection1(text);
                    section2 = _extractor.ExtractSection2(text);
                    summary.Processed = true;
                    break;
                case "Section3":
                    var s3 = _extractor.ExtractSection3(text);
                    if (s3 != null) section3List.Add(s3);
                    summary.Processed = true;
                    break;
                case "SupportingDocument":
                    var doc = _extractor.ExtractSupportingDocument(text);
                    if (doc != null) supportingDocs.Add(doc);
                    summary.Processed = true;
                    break;
                default:
                    ignoredCount++;
                    // Still attempt supporting classification soft pass
                    var soft = _extractor.ExtractSupportingDocument(text);
                    if (soft != null)
                    {
                        supportingDocs.Add(soft);
                        summary.Label = "SupportingDocument";
                        summary.Processed = true;
                        ignoredCount--;
                    }
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to process content for {File}", PiiScrubber.Scrub(pdfFile.FileName));
            ignoredCount++;
        }

        pageSummary.Add(summary);

        if (section2 != null && section1 != null && !string.IsNullOrWhiteSpace(section2.FirstDayOfEmployment))
            section1.EmployeeFirstDayOfEmployment = section2.FirstDayOfEmployment;

        var form = new I9FormDetails
        {
            Section1 = section1,
            Section2 = section2,
            Section3 = section3List,
            SupportingDocuments = supportingDocs
        };

        var pipeline = new I9AuditPipelineResult
        {
            SourceFileName = pdfFile.FileName,
            Extraction = new I9ExtractionResult
            {
                Section1 = section1,
                Section2 = section2,
                Section3List = section3List,
                SupportingDocumentsCount = supportingDocs.Count,
                IgnoredPagesCount = ignoredCount,
                ExtractedTextPreview = text.Length > 280 ? text[..280] : text,
                ExtractionMethod = "local-text"
            },
            PageSummary = pageSummary
        };

        if (section1 == null && section2 == null && supportingDocs.Count == 0)
        {
            pipeline.ValidationStatus = "Skipped";
            pipeline.ValidationMethod = "local-rules";
            pipeline.Validation = new I9ValidationResult
            {
                Findings =
                {
                    new ValidationFinding
                    {
                        Section = "Document Review",
                        Field = "contentClass",
                        Severity = "Warning",
                        Rule = "Classification",
                        Message = "Extracted text does not contain Form I-9 / USCIS employment eligibility markers. Classification is based on content, not the filename.",
                        DetectedValue = text.Length > 160 ? text[..160] : text,
                        DocumentName = pdfFile.FileName,
                        Recommendation = "If this file was intended as Form I-9, upload the correct form. Otherwise retain only if it is a supporting identity document."
                    }
                }
            };
            pipeline.Remediation = _rules.BuildRemediation(pipeline.Validation, _platform.BaseUrl);
            return pipeline;
        }

        if (section1 == null && section2 == null && supportingDocs.Count > 0)
        {
            pipeline.ValidationStatus = "Complete";
            pipeline.ValidationMethod = "local-rules";
            pipeline.Validation = new I9ValidationResult { Findings = new List<ValidationFinding>() };
            pipeline.EVerifyReadiness = _rules.AssessEVerifyReadiness(form);
            pipeline.Remediation = _rules.BuildRemediation(pipeline.Validation, _platform.BaseUrl);
            return pipeline;
        }

        try
        {
            var validation = _rules.Validate(form, pdfFile.FileName);
            pipeline.Validation = validation;
            pipeline.ValidationMethod = "local-rules";
            pipeline.ValidationStatus = validation.Findings.Any(f =>
                f.Section == "SYSTEM" && f.Severity == "Error") ? "Failed" : "Complete";
        }
        catch (Exception ex)
        {
            pipeline.ValidationStatus = "Failed";
            pipeline.Validation = new I9ValidationResult
            {
                Findings =
                {
                    new ValidationFinding
                    {
                        Section = "SYSTEM",
                        Field = "Validation",
                        Severity = "Error",
                        Rule = "Rules engine",
                        Message = ex.Message,
                        DocumentName = pdfFile.FileName
                    }
                }
            };
        }

        pipeline.EVerifyReadiness = _rules.AssessEVerifyReadiness(form);
        pipeline.Remediation = _rules.BuildRemediation(pipeline.Validation, _platform.BaseUrl);

        _logger.LogInformation(
            "Audit {AuditId} complete: status={Status}, compliant={Compliant}, findings={Count}",
            pipeline.AuditId, pipeline.ValidationStatus, pipeline.IsCompliant, pipeline.Validation.Findings.Count);

        await Task.CompletedTask;
        return pipeline;
    }
}
