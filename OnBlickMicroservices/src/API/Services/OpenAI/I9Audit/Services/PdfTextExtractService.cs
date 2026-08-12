using System.Text;
using System.Text.RegularExpressions;

namespace I9Audit.Services;

/// <summary>
/// Extracts printable text from uploaded PDF bytes (live document content).
/// Uses PDF content-stream string operators (no third-party PDF package required).
/// </summary>
public class PdfTextExtractService
{
    private readonly ILogger<PdfTextExtractService> _logger;

    public PdfTextExtractService(ILogger<PdfTextExtractService> logger) => _logger = logger;

    public (string Text, int PageCount) Extract(Stream pdfStream, string fileName)
    {
        using var ms = new MemoryStream();
        pdfStream.CopyTo(ms);
        var bytes = ms.ToArray();
        var text = ExtractPdfStreamText(bytes);
        var pageCount = CountPages(bytes);
        if (text.Length < 8)
            _logger.LogWarning("Little/no extractable text in {File} (likely image-only PDF)", fileName);
        return (text, Math.Max(pageCount, text.Length > 0 ? 1 : 0));
    }

    static int CountPages(byte[] bytes)
    {
        var raw = Encoding.Latin1.GetString(bytes);
        var m = Regex.Matches(raw, @"/Type\s*/Page[^s]");
        return m.Count;
    }

    static string ExtractPdfStreamText(byte[] bytes)
    {
        var raw = Encoding.Latin1.GetString(bytes);
        var chunks = new List<string>();
        foreach (Match m in Regex.Matches(raw, @"\((?:\\.|[^\\)])*\)\s*Tj"))
        {
            var token = m.Value;
            var inner = Regex.Replace(token, @"\s*Tj$", "");
            if (inner.StartsWith("(") && inner.EndsWith(")")) inner = inner[1..^1];
            chunks.Add(Unescape(inner));
        }
        foreach (Match m in Regex.Matches(raw, @"\[(.*?)\]\s*TJ", RegexOptions.Singleline))
        {
            foreach (Match p in Regex.Matches(m.Groups[1].Value, @"\((?:\\.|[^\\)])*\)"))
            {
                var inner = p.Value;
                if (inner.StartsWith("(") && inner.EndsWith(")")) inner = inner[1..^1];
                chunks.Add(Unescape(inner));
            }
        }
        // UTF-16 BE hex strings
        foreach (Match m in Regex.Matches(raw, @"<([0-9A-Fa-f\s]+)>"))
        {
            var hex = Regex.Replace(m.Groups[1].Value, @"\s+", "");
            if (hex.Length < 4 || hex.Length % 2 != 0) continue;
            try
            {
                var chars = new List<char>();
                for (int i = 0; i + 3 < hex.Length; i += 4)
                {
                    var code = Convert.ToInt32(hex.Substring(i, 4), 16);
                    if (code != 0 && code != 0xFEFF) chars.Add((char)code);
                }
                var s = new string(chars.ToArray()).Trim();
                if (s.Length > 1) chunks.Add(s);
            }
            catch { /* ignore */ }
        }
        return Regex.Replace(string.Join(" ", chunks), @"\s+", " ").Trim();
    }

    static string Unescape(string s) =>
        s.Replace("\\n", "\n").Replace("\\r", "\r").Replace("\\t", "\t")
            .Replace("\\(", "(").Replace("\\)", ")").Replace("\\\\", "\\");
}
