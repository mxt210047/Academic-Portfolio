namespace I9Audit.Configuration;

public class PlatformOptions
{
    public const string SectionName = "Platform";
    public string BaseUrl { get; set; } = "http://127.0.0.1:5089";
    public int PageDelayMs { get; set; } = 0;
}

public class ParsingOptions
{
    public const string SectionName = "Parsing";
    /// <summary>Optional external Parsing microservice base URL.</summary>
    public string? BaseUrl { get; set; }
    public bool FallbackToVisionPipeline { get; set; } = true;
    /// <summary>When vision/Azure are unavailable, use local PDF text + rules pipeline.</summary>
    public bool EnableLocalTextPipeline { get; set; } = true;
}
