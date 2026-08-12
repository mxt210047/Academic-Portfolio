/**
 * Form I-9 packet analysis over LIVE imported document content.
 * Prefers I9AuditService pipeline API (PDF → extract → validate).
 * Falls back to in-browser content extraction when the API is unavailable.
 * Does NOT use filename patterns as the primary audit engine.
 * Does NOT import mockData.js.
 */

import {
  cacheDocumentExtraction,
  getDocumentFile,
  getDocumentRecord,
} from "./documentStore.js";
import { extractDocumentContent } from "./documentExtract.js";
import {
  analyzeDocumentContent,
  analyzePacketFromContent,
} from "./i9ContentAnalysis.js";
import {
  checkAuditApiHealth,
  extractAuditFromFile,
  mapPipelineExtraction,
  mapPipelineFindings,
} from "./i9AuditApi.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let apiHealthyCache = { at: 0, ok: null };

async function isAuditApiAvailable() {
  if (Date.now() - apiHealthyCache.at < 15000) return apiHealthyCache.ok;
  const health = await checkAuditApiHealth();
  apiHealthyCache = { at: Date.now(), ok: Boolean(health) };
  return apiHealthyCache.ok;
}

/**
 * Analyze every imported document for an employee using live file bytes.
 * Returns complete findings with no truncation.
 */
export async function analyzeEmployee(employee, ctx = {}) {
  const docs = (employee.documents || []).map((d) =>
    typeof d === "string"
      ? { id: null, name: d }
      : { id: d.id, name: d.name, relativePath: d.relativePath, size: d.size }
  );
  const now = new Date().toISOString();
  const allFindings = [];
  let n = 0;
  const nextId = () => `f-${employee.id}-${++n}`;

  const docResults = [];
  const extractionsByDocument = {};
  let analysisMethod = "document-content";
  let pipelineAuditId = null;

  const apiOk = await isAuditApiAvailable();

  for (const d of docs) {
    const record = d.id ? getDocumentRecord(d.id) : null;
    const file = d.id ? getDocumentFile(d.id) : null;

    // Prefer I9AuditService pipeline for live PDFs
    if (apiOk && file && (record?.kind === "pdf" || /\.pdf$/i.test(d.name) || file.type?.includes("pdf"))) {
      try {
        const pipeline = await extractAuditFromFile(file, { signal: ctx.signal });
        const mappedFindings = mapPipelineFindings(pipeline, {
          documentId: d.id,
          documentName: d.name,
          idPrefix: `f-${employee.id}-${d.id || "doc"}`,
        });
        // Ensure ids via nextId for uniqueness in packet
        for (const f of mappedFindings) {
          if (!f.id || allFindings.some((x) => x.id === f.id)) f.id = nextId();
          if (!f.recommendation) {
            f.recommendation =
              "Human review is required; automated correction guidance was not determined for this finding.";
          }
        }
        const extractionSummary = mapPipelineExtraction(pipeline, d.name);
        pipelineAuditId = extractionSummary.auditId || pipelineAuditId;
        analysisMethod = "i9audit-pipeline";

        cacheDocumentExtraction(d.id, {
          method: extractionSummary.method,
          charCount: extractionSummary.charCount,
          pageCount: extractionSummary.pageCount,
          ok: extractionSummary.ok,
          uncertainty: extractionSummary.uncertainty,
          textPreview: extractionSummary.textPreview,
          extractedAt: now,
        });

        docResults.push({
          documentId: d.id,
          documentName: d.name,
          classification: extractionSummary.classification,
          findings: mappedFindings,
          fields: extractionSummary.fields,
        });
        extractionsByDocument[d.id || d.name] = {
          ...extractionSummary,
          documentName: d.name,
        };
        allFindings.push(...mappedFindings);
        continue;
      } catch (err) {
        console.warn("I9Audit pipeline failed; falling back to browser content analysis", err);
      }
    }

    let extraction = null;
    if (file) {
      extraction = await extractDocumentContent(file, {
        kind: record?.kind,
        name: d.name,
        type: record?.type || file.type,
      });
      extraction.size = file.size;
      cacheDocumentExtraction(d.id, {
        method: extraction.method,
        charCount: extraction.charCount,
        pageCount: extraction.pageCount,
        ok: extraction.ok,
        uncertainty: extraction.uncertainty || null,
        textPreview: (extraction.text || "").slice(0, 280),
        extractedAt: extraction.extractedAt,
      });
    } else {
      extraction = {
        text: "",
        ok: false,
        method: "missing-file",
        charCount: 0,
        pageCount: null,
        size: record?.size ?? d.size ?? 0,
        uncertainty: `Live File handle missing for ${d.name}. Re-import the document.`,
      };
    }

    const result = analyzeDocumentContent({
      nextId,
      employeeName: employee.name,
      documentId: d.id,
      documentName: d.name,
      extraction,
      filenameHint: d.name,
    });

    docResults.push({
      documentId: d.id,
      documentName: d.name,
      classification: result.classification,
      findings: result.findings,
      fields: result.fields,
    });
    extractionsByDocument[d.id || d.name] = {
      ...result.extractionSummary,
      classification: result.classification,
      fields: result.fields,
      documentName: d.name,
    };
    allFindings.push(...result.findings);
  }

  // Packet-level conclusions only for browser path classifications
  if (analysisMethod !== "i9audit-pipeline") {
    allFindings.push(
      ...analyzePacketFromContent({
        nextId,
        employeeName: employee.name,
        docResults,
      })
    );
  }

  for (const f of allFindings) {
    if (!f.recommendation) {
      f.recommendation =
        "Human review is required; automated correction guidance was not determined for this finding.";
    }
  }

  const section1 = allFindings.filter((f) => f.section === "Section 1");
  const section2 = allFindings.filter((f) => f.section === "Section 2");
  const documentReview = allFindings.filter((f) => f.section === "Document Review");
  const displayNames = docs.map((d) => d.name);
  const errors = allFindings.length;

  const recommendation = errors
    ? `Correct all ${errors} finding(s) for ${employee.name} across ${
        displayNames.join(", ") || "imported documents"
      }.`
    : `No automated findings for ${employee.name}. Retain the Form I-9 per policy.`;

  return {
    ...employee,
    errors,
    analysisStatus: "completed",
    auditDate: now.slice(0, 10),
    completedOn: now,
    findings: {
      purpose: ctx.organizationName
        ? `Form I-9 corrections — ${ctx.organizationName}`
        : "Form I-9 corrections",
      reviewedBy: "OnBlick Audit Agent",
      auditId: pipelineAuditId || ctx.auditId || null,
      employeeId: employee.id,
      documentNames: displayNames,
      documentIds: docs.map((d) => d.id).filter(Boolean),
      analysisMethod,
      extractions: extractionsByDocument,
      all: allFindings,
      section1,
      section2,
      documentReview,
      recommendation,
    },
  };
}

export async function analyzeAudit(audit, { onProgress, signal } = {}) {
  const roster = audit.roster || [];
  const total = roster.length;
  const nextRoster = [];
  const ctx = { auditId: audit.id, organizationName: audit.name, signal };

  for (let i = 0; i < roster.length; i++) {
    if (signal?.aborted) throw new Error("Analysis cancelled");
    const emp = roster[i];
    onProgress?.({
      employeeName: emp.name,
      index: i,
      total,
      status: `I-9 audit pipeline: ${emp.name} (${i + 1}/${total || 1})`,
    });
    if (signal?.aborted) throw new Error("Analysis cancelled");
    const analyzed = await analyzeEmployee({ ...emp, analysisStatus: "analyzing" }, ctx);
    nextRoster.push(analyzed);
    await delay(40);
  }

  onProgress?.({
    employeeName: null,
    index: total,
    total,
    status: "Finalizing audit results",
  });
  await delay(80);

  return {
    ...audit,
    roster: nextRoster,
    status: "Completed",
    completedAt: new Date().toISOString(),
  };
}

export function getAllFindings(employee) {
  const pack = employee?.findings;
  if (!pack) return [];
  if (Array.isArray(pack.all)) return [...pack.all];
  return [...(pack.section1 || []), ...(pack.section2 || []), ...(pack.documentReview || [])];
}

export function getFindingsForDocument(employee, documentId) {
  const all = getAllFindings(employee);
  if (!documentId) {
    return all.filter((f) => !f.documentId);
  }
  return all.filter((f) => f.documentId === documentId);
}

export function getExtractionForDocument(employee, documentId) {
  const map = employee?.findings?.extractions || {};
  if (!documentId) return null;
  return map[documentId] || null;
}
