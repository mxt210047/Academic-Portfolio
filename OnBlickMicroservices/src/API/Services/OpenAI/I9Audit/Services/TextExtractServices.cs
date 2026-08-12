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
    public Section1Dto ExtractSection1(string text)
    {
        return new Section1Dto
        {
            LastName = Capture(text, @"last\s+name(?:\s*\(family\s+name\))?", @"([A-Za-z][A-Za-z .'-]{0,60})"),
            FirstName = Capture(text, @"first\s+name(?:\s*\(given\s+name\))?", @"([A-Za-z][A-Za-z .'-]{0,60})"),
            MiddleInitial = Capture(text, @"middle\s+initial", @"([A-Za-z]|N/?A)"),
            Address = Capture(text, @"address\s*\(street\s+number\s+and\s+name\)", @"([A-Za-z0-9][A-Za-z0-9 .,#-]{0,80})"),
            City = Capture(text, @"city\s+or\s+town", @"([A-Za-z][A-Za-z .'-]{0,40})"),
            State = Capture(text, @"\bstate\b", @"([A-Z]{2})"),
            Zip = Capture(text, @"zip\s+code", @"(\d{5}(?:-\d{4})?)"),
            DateOfBirth = Capture(text, @"date\s+of\s+birth", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"),
            Ssn = Capture(text, @"(?:U\.?S\.?\s+)?social\s+security\s+number", @"([\dX*]{3}[-\s]?[\dX*]{2}[-\s]?[\dX*]{4}|XXX-XX-XXXX)"),
            CitizenshipStatus = MatchOne(text, @"citizen\s+of\s+the\s+united\s+states|noncitizen\s+national|lawful\s+permanent\s+resident|alien\s+authorized\s+to\s+work|noncitizen\s+authorized\s+to\s+work"),
            EmployeeSignaturePresent = Regex.IsMatch(text, @"employee\s+signature", RegexOptions.IgnoreCase) &&
                                       !Regex.IsMatch(text, @"employee\s+signature[\s\S]{0,40}\b(missing|blank)\b", RegexOptions.IgnoreCase),
            EmployeeSignatureDate = Capture(text, @"(?:today'?s?\s+)?date\s*\(mm/dd/yyyy\)", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})")
        };
    }

    public Section2Dto ExtractSection2(string text)
    {
        return new Section2Dto
        {
            DocumentTitle = Capture(text, @"document\s+title", @"([A-Za-z][A-Za-z0-9 /-]{0,60})"),
            IssuingAuthority = Capture(text, @"issuing\s+authority", @"([A-Za-z][A-Za-z0-9 ./-]{0,60})"),
            DocumentNumber = Capture(text, @"document\s+(?:number|#|no\.?)", @"([A-Za-z0-9-]{3,40})"),
            ExpirationDate = Capture(text, @"expiration\s+date", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|N/?A)"),
            FirstDayOfEmployment = Capture(text, @"first\s+day\s+of\s+employment", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"),
            EmployerSignaturePresent = Regex.IsMatch(text, @"signature\s+of\s+employer|employer\s+or\s+authorized\s+representative\s+signature", RegexOptions.IgnoreCase),
            DateOfEmployerSignature = Capture(text, @"date\s+of\s+employer", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"),
            EmployerName = Capture(text, @"employer'?s?\s+business(?:\s+or\s+organization)?\s+name", @"([A-Za-z][A-Za-z0-9 .,&-]{0,80})")
        };
    }

    public Section3Dto? ExtractSection3(string text)
    {
        var rehire = Capture(text, @"date\s+of\s+rehire|rehire", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})");
        if (rehire == null && !Regex.IsMatch(text, @"section\s*3", RegexOptions.IgnoreCase)) return null;
        return new Section3Dto { RehireDate = rehire };
    }

    public SupportingDocumentDto? ExtractSupportingDocument(string text)
    {
        var type = MatchOne(text, @"passport|driver'?s?\s+licen[cs]e|social\s+security|employment\s+authorization|permanent\s+resident|green\s+card");
        if (type == null) return null;
        return new SupportingDocumentDto
        {
            DocumentType = type,
            DocumentNumber = Capture(text, @"(?:passport\s+no|document\s+number|no\.?)", @"([A-Za-z0-9-]{3,40})"),
            ExpirationDate = Capture(text, @"expiration|date\s+of\s+expiration", @"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"),
            IssuingAuthority = Capture(text, @"nationality|issuing|authority|united\s+states", @"([A-Za-z][A-Za-z .]{0,40})")
        };
    }

    static string? Capture(string text, string label, string value)
    {
        var m = Regex.Match(text, label + @"[\s:.-]*" + value, RegexOptions.IgnoreCase);
        if (!m.Success || m.Groups.Count < 2) return null;
        var v = m.Groups[1].Value.Trim();
        return string.IsNullOrWhiteSpace(v) || Regex.IsMatch(v, @"^(n/?a|none|null|-)$", RegexOptions.IgnoreCase) ? null : v;
    }

    static string? MatchOne(string text, string pattern)
    {
        var m = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
        return m.Success ? m.Value : null;
    }
}
