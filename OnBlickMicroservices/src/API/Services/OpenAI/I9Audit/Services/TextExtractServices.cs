using System.Text.RegularExpressions;
using I9Audit.Models;

namespace I9Audit.Services;

/// <summary>
/// Content-based page/document classification (not filename).
/// </summary>
public class TextPageClassifierService
{
    public string Classify(string text)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Trim().Length < 8) return "Ignore";

        var hasI9 = Regex.IsMatch(text, @"employment\s+eligibility\s+verification|\bform\s*i-?9\b|\buscis\b|omb\s+no\.?\s*1615-0047", RegexOptions.IgnoreCase);
        var hasS1 = Regex.IsMatch(text, @"section\s*1|employee\s+information\s+and\s+attestation", RegexOptions.IgnoreCase);
        var hasS2 = Regex.IsMatch(text, @"section\s*2|employer.+review\s+and\s+verification|document\s+title", RegexOptions.IgnoreCase);
        var hasS3 = Regex.IsMatch(text, @"section\s*3|reverification|rehire", RegexOptions.IgnoreCase);
        var support = Regex.IsMatch(text, @"\bpassport\b|driver'?s?\s+licen[cs]e|social\s+security|employment\s+authorization|permanent\s+resident|\bgreen\s+card\b", RegexOptions.IgnoreCase);

        if (hasI9 && hasS1 && hasS2) return "Section1And2";
        if (hasI9 && hasS1) return "Section1";
        if (hasI9 && hasS2) return "Section2";
        if (hasI9 && hasS3) return "Section3";
        if (hasI9) return "Section1And2";
        if (support) return "SupportingDocument";
        return "Ignore";
    }
}

public class TextFieldExtractorService
{
    static readonly string[] LabelNoise =
    {
        "last name", "first name", "middle initial", "family name", "given name",
        "address", "apt", "city", "town", "state", "zip", "date of birth",
        "social security", "employee", "employer", "signature", "today",
        "document title", "issuing authority", "document number", "expiration",
        "first day", "citizenship", "attestation", "section", "form i-9",
        "omb", "uscis", "telephone", "email", "preparer", "translator",
        "list a", "list b", "list c", "alien", "authorized", "permanent resident",
        "noncitizen", "united states", "number", "date", "mm/dd/yyyy"
    };

    public Section1Dto ExtractSection1(string text)
    {
        var last = CaptureValue(text, @"Last\s+Name(?:\s*\(Family\s+Name\))?", stopBefore: @"First\s+Name|Middle\s+Initial|Address");
        var first = CaptureValue(text, @"First\s+Name(?:\s*\(Given\s+Name\))?", stopBefore: @"Middle\s+Initial|Address|Last\s+Name");
        var middle = CaptureValue(text, @"Middle\s+Initial", stopBefore: @"Address|Apt|Other\s+Last", maxLen: 3);

        return new Section1Dto
        {
            LastName = SanitizeName(last),
            FirstName = SanitizeName(first),
            MiddleInitial = SanitizeMiddle(middle),
            Address = CaptureValue(text, @"Address\s*\(Street\s+Number\s+and\s+Name\)", stopBefore: @"Apt\.?\s*Number|City\s+or\s+Town"),
            City = CaptureValue(text, @"City\s+or\s+Town", stopBefore: @"State|ZIP"),
            State = CaptureExact(text, @"\bState\b", @"\b([A-Z]{2})\b"),
            Zip = CaptureExact(text, @"ZIP\s+Code", @"(\d{5}(?:-\d{4})?)"),
            DateOfBirth = CaptureExact(text, @"Date\s+of\s+Birth", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"),
            Ssn = CaptureExact(text, @"(?:U\.?S\.?\s+)?Social\s+Security\s+Number", @"(\d{3}[-\s]?\d{2}[-\s]?\d{4}|XXX-XX-XXXX)"),
            CitizenshipStatus = DetectSelectedCitizenship(text),
            EmployeeSignaturePresent = DetectCompletedSignature(text, @"Employee\s+Signature"),
            EmployeeSignatureDate = CaptureExact(text, @"(?:Today'?s?\s+)?Date\s*\(mm/dd/yyyy\)", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})")
        };
    }

    public Section2Dto ExtractSection2(string text)
    {
        return new Section2Dto
        {
            DocumentTitle = SanitizeDocField(CaptureValue(text, @"Document\s+Title", stopBefore: @"Issuing\s+Authority|Document\s+Number")),
            IssuingAuthority = SanitizeDocField(CaptureValue(text, @"Issuing\s+Authority", stopBefore: @"Document\s+Number|Expiration")),
            DocumentNumber = SanitizeDocField(CaptureExact(text, @"Document\s+(?:Number|#|No\.?)", @"([A-Za-z0-9-]{5,40})")),
            ExpirationDate = CaptureExact(text, @"Expiration\s+Date", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|N/?A)"),
            FirstDayOfEmployment = CaptureExact(text, @"First\s+day\s+of\s+employment", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"),
            EmployerSignaturePresent = DetectCompletedSignature(text, @"Signature\s+of\s+Employer|Employer\s+or\s+Authorized\s+Representative\s+Signature"),
            DateOfEmployerSignature =
                CaptureExact(text, @"Date\s+of\s+[Ee]mployer(?:\s+Signature)?", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})")
                ?? CaptureDateNear(text, @"Signature\s+of\s+Employer|Employer\s+or\s+Authorized\s+Representative\s+Signature"),
            EmployerName = SanitizeDocField(CaptureValue(text, @"Employer'?s?\s+Business(?:\s+or\s+Organization)?\s+Name", stopBefore: @"Address|Title\s+of|Signature"))
        };
    }

    public Section3Dto? ExtractSection3(string text)
    {
        if (!Regex.IsMatch(text, @"section\s*3|reverification|rehire", RegexOptions.IgnoreCase)) return null;
        return new Section3Dto
        {
            RehireDate = CaptureExact(text, @"Date\s+of\s+Rehire|Rehire", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})")
        };
    }

    public SupportingDocumentDto? ExtractSupportingDocument(string text)
    {
        var type = MatchOne(text, @"passport|driver'?s?\s+licen[cs]e|social\s+security\s+card|employment\s+authorization|permanent\s+resident|green\s+card");
        if (type == null) return null;
        return new SupportingDocumentDto
        {
            DocumentType = type,
            DocumentNumber = CaptureExact(text, @"(?:Passport\s+No|Document\s+Number|No\.?)", @"([A-Za-z0-9-]{5,40})"),
            ExpirationDate = CaptureExact(text, @"Expiration|Date\s+of\s+expiration", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"),
            IssuingAuthority = CaptureValue(text, @"Nationality|Issuing\s+Authority", stopBefore: @"Date|Passport|Surname", maxLen: 40)
        };
    }

    /// <summary>
    /// Citizenship option text on a blank form is boilerplate — only accept when a single
    /// status appears with supporting evidence, or an explicit selected pattern.
    /// </summary>
    static string? DetectSelectedCitizenship(string text)
    {
        var options = new[]
        {
            "citizen of the united states",
            "noncitizen national",
            "lawful permanent resident",
            "alien authorized to work",
            "noncitizen authorized to work"
        };
        var hits = options.Count(o => Regex.IsMatch(text, Regex.Escape(o), RegexOptions.IgnoreCase));
        // Blank Form I-9 prints all options — that is not a selection.
        if (hits >= 2) return null;

        if (Regex.IsMatch(text, @"\[\s*[xX✓✔]\s*\].{0,40}(citizen|noncitizen|permanent\s+resident|alien\s+authorized)", RegexOptions.IgnoreCase))
        {
            var m = Regex.Match(text, @"\[\s*[xX✓✔]\s*\]\s*(citizen\s+of\s+the\s+united\s+states|noncitizen\s+national|lawful\s+permanent\s+resident|alien\s+authorized\s+to\s+work|noncitizen\s+authorized\s+to\s+work)", RegexOptions.IgnoreCase);
            if (m.Success) return m.Groups[1].Value;
        }

        // A completed form typically retains only the selected attestation narrative.
        if (hits == 1) return MatchOne(text, string.Join("|", options));
        return null;
    }

    /// <summary>
    /// Label text alone is not a completed signature.
    /// </summary>
    static bool DetectCompletedSignature(string text, string labelPattern)
    {
        // Wrap alternations so the look-ahead window applies to the whole label, not only the last branch.
        var window = Regex.Match(
            text,
            "(?:" + labelPattern + @").{0,120}",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (!window.Success) return false;
        var chunk = window.Value;
        if (Regex.IsMatch(chunk, @"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}")) return true;
        if (Regex.IsMatch(chunk, @"signed\s+by\s+[A-Z][a-zA-Z\-']+", RegexOptions.IgnoreCase)) return true;
        // Name token immediately after signature label (not another form label)
        var nameAfter = Regex.Match(
            chunk,
            "(?:" + labelPattern + @")[\s:.\-]+([A-Z][a-zA-Z\-']+(?:\s+[A-Z][a-zA-Z\-']+){0,3})",
            RegexOptions.IgnoreCase);
        if (nameAfter.Success && !IsNoise(nameAfter.Groups[1].Value) && !LooksLikeLabelRun(nameAfter.Groups[1].Value))
            return true;
        return false;
    }

    static string? CaptureExact(string text, string label, string valuePattern)
    {
        var m = Regex.Match(text, "(?:" + label + @")[\s:.\-]*" + valuePattern, RegexOptions.IgnoreCase);
        if (!m.Success || m.Groups.Count < 2) return null;
        var v = m.Groups[m.Groups.Count - 1].Value.Trim();
        return IsNoise(v) ? null : v;
    }

    static string? CaptureDateNear(string text, string labelPattern)
    {
        var window = Regex.Match(
            text,
            "(?:" + labelPattern + @").{0,120}",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (!window.Success) return null;
        var m = Regex.Match(window.Value, @"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}");
        return m.Success ? m.Value : null;
    }

    static string? CaptureValue(string text, string label, string? stopBefore = null, int maxLen = 80)
    {
        var stop = string.IsNullOrEmpty(stopBefore) ? @"$" : stopBefore;
        var pattern = label + @"[\s:.\-]*(.+?)(?=" + stop + @"|$)";
        var m = Regex.Match(text, pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (!m.Success) return null;
        var v = Regex.Replace(m.Groups[1].Value, @"\s+", " ").Trim(" .:-\t".ToCharArray());
        if (v.Length > maxLen) v = v[..maxLen].Trim();
        if (string.IsNullOrWhiteSpace(v) || IsNoise(v)) return null;
        // If captured text is mostly other field labels, treat as empty
        if (LooksLikeLabelRun(v)) return null;
        return v;
    }

    static bool LooksLikeLabelRun(string v)
    {
        var lower = v.ToLowerInvariant();
        var hits = LabelNoise.Count(n => lower.Contains(n));
        return hits >= 2 || LabelNoise.Any(n => lower == n);
    }

    static bool IsNoise(string v)
    {
        if (string.IsNullOrWhiteSpace(v)) return true;
        if (Regex.IsMatch(v, @"^(n/?a|none|null|-|\.|_{2,})$", RegexOptions.IgnoreCase)) return true;
        var lower = v.Trim().ToLowerInvariant();
        return LabelNoise.Any(n => lower == n || lower.StartsWith(n + " ") || lower.EndsWith(" " + n));
    }

    static string? SanitizeName(string? v)
    {
        if (v == null) return null;
        if (LooksLikeLabelRun(v) || IsNoise(v)) return null;
        // Names shouldn't contain digits or "Name"
        if (Regex.IsMatch(v, @"\d") || Regex.IsMatch(v, @"\bname\b", RegexOptions.IgnoreCase)) return null;
        if (v.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length > 4) return null;
        return v;
    }

    static string? SanitizeMiddle(string? v)
    {
        if (v == null) return null;
        v = v.Trim();
        if (v.Length > 3) return null;
        if (IsNoise(v) || Regex.IsMatch(v, @"address|name|initial", RegexOptions.IgnoreCase)) return null;
        return v;
    }

    static string? SanitizeDocField(string? v)
    {
        if (v == null) return null;
        if (LooksLikeLabelRun(v) || IsNoise(v)) return null;
        if (Regex.IsMatch(v, @"document\s+(title|number)|issuing\s+authority|expiration|first\s+day|list\s+[abc]", RegexOptions.IgnoreCase))
            return null;
        // Single boilerplate tokens often captured from adjacent labels
        if (Regex.IsMatch(v.Trim(), @"^(title|number|authority|expiration|date|issuing|document|employer|employee|signature|first|day|employment|list|of|the|and|or)$", RegexOptions.IgnoreCase))
            return null;
        if (Regex.IsMatch(v, @"^(first\s+day|issuing\s+authority|expiration\s+date)", RegexOptions.IgnoreCase))
            return null;
        return v;
    }

    static string? MatchOne(string text, string pattern)
    {
        var m = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
        return m.Success ? m.Value : null;
    }
}
