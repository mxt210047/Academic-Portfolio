/**
 * Client for I9AuditService pipeline API (live PDF audit).
 * POST multipart file → structured pipeline result with Validation.Findings.
 */

const DEFAULT_BASE = "http://127.0.0.1:5089";

export function getAuditApiBase() {
  try {
    const q = new URLSearchParams(location.search).get("api");
    if (q) return q.replace(/\/$/, "");
  } catch {
    /* ignore */
  }
  return DEFAULT_BASE;
}

export async function checkAuditApiHealth(base = getAuditApiBase()) {
  try {
    const res = await fetch(`${base}/api/i9-assist/health`, { method: "GET" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Audit a live File through I9AuditService.ExtractAsync.
 * @param {File} file
 * @param {{ signal?: AbortSignal, baseUrl?: string }} [opts]
 */
export async function extractAuditFromFile(file, opts = {}) {
  const base = opts.baseUrl || getAuditApiBase();
  const body = new FormData();
  body.append("file", file, file.name);

  const res = await fetch(`${base}/api/i9-assist/audit/extract`, {
    method: "POST",
    body,
    signal: opts.signal,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`I9Audit API ${res.status}: ${errText || res.statusText}`);
  }
  return res.json();
}

/**
 * Map pipeline ValidationFinding[] → Document Analysis finding shape.
 */
export function mapPipelineFindings(pipeline, { documentId, documentName, idPrefix }) {
  const rows = pipeline?.validation?.findings || pipeline?.Validation?.Findings || [];
  const list = Array.isArray(rows) ? rows : [];
  return list.map((f, i) => {
    const sectionRaw = f.section || f.Section || "Document Review";
    const section = normalizeSection(sectionRaw);
    const severityRaw = (f.severity || f.Severity || "Error").toLowerCase();
    const cls = severityRaw === "warning" || severityRaw === "info" ? "technical" : "substantive";
    return {
      id: f.id || f.Id || `${idPrefix}-${i + 1}`,
      section,
      class: cls,
      severity: severityRaw === "error" ? "high" : severityRaw === "warning" ? "medium" : "low",
      title: f.rule || f.Rule || f.field || f.Field || "Finding",
      detail: f.message || f.Message || "",
      status: "open",
      documentId: documentId || null,
      documentName: f.documentName || f.DocumentName || documentName || null,
      field: f.field || f.Field || null,
      detectedValue: f.detectedValue ?? f.DetectedValue ?? null,
      recommendation: f.recommendation || f.Recommendation || null,
      pageRef: f.pageNumber ?? f.PageNumber ?? null,
      source: "i9audit-pipeline",
    };
  });
}

export function mapPipelineExtraction(pipeline, documentName) {
  const ext = pipeline?.extraction || pipeline?.Extraction || {};
  const s1 = ext.section1 || ext.Section1 || null;
  const s2 = ext.section2 || ext.Section2 || null;
  const supportCount = ext.supportingDocumentsCount ?? ext.SupportingDocumentsCount ?? 0;
  const pageSummary = pipeline?.pageSummary || pipeline?.PageSummary || [];
  const pageLabels = pageSummary.map((p) => p.label || p.Label || "").join(" ");
  const preview = ext.extractedTextPreview || ext.ExtractedTextPreview || "";
  const method = ext.extractionMethod || ext.ExtractionMethod || "i9audit-pipeline";
  const fields = {};
  if (s1) {
    Object.entries(s1).forEach(([k, v]) => {
      if (v != null && v !== "") fields[`section1.${k}`] = v;
    });
  }
  if (s2) {
    Object.entries(s2).forEach(([k, v]) => {
      if (v != null && v !== "") fields[`section2.${k}`] = v;
    });
  }
  let label = "unknown";
  if (s1 || s2) label = "form_i9";
  else if (supportCount > 0 || /SupportingDocument/i.test(pageLabels)) label = "supporting_id";
  else if (preview) label = "other";
  return {
    method,
    charCount: preview.length,
    pageCount: pageSummary.length || null,
    ok: Boolean(preview) || Boolean(s1) || Boolean(s2) || supportCount > 0,
    uncertainty: null,
    textPreview: preview,
    classification: label,
    fields,
    documentName,
    auditId: pipeline?.auditId || pipeline?.AuditId || null,
    validationStatus: pipeline?.validationStatus || pipeline?.ValidationStatus || null,
    validationMethod: pipeline?.validationMethod || pipeline?.ValidationMethod || null,
  };
}

function normalizeSection(section) {
  const s = String(section || "");
  if (/section\s*1/i.test(s) || s === "Section 1") return "Section 1";
  if (/section\s*2/i.test(s) || s === "Section 2") return "Section 2";
  if (/section\s*3/i.test(s)) return "Section 2";
  if (/system/i.test(s)) return "Document Review";
  return "Document Review";
}
