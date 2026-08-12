/**
 * Form I-9 packet analysis over LIVE imported document content.
 * Extracts text from each File, then runs content-based I-9 rules.
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  /** @type {import("./i9ContentAnalysis.js").makeFinding extends Function ? any[] : any[]} */
  const allFindings = [];
  let n = 0;
  const nextId = () => `f-${employee.id}-${++n}`;

  const docResults = [];
  const extractionsByDocument = {};

  for (const d of docs) {
    const record = d.id ? getDocumentRecord(d.id) : null;
    const file = d.id ? getDocumentFile(d.id) : null;

    let extraction = null;
    if (file) {
      extraction = await extractDocumentContent(file, {
        kind: record?.kind,
        name: d.name,
        type: record?.type || file.type,
      });
      // Attach size for empty-file checks
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
      filenameHint: d.name, // supplementary only — content rules decide classification
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

  // Packet-level content conclusions (still content-driven)
  allFindings.push(
    ...analyzePacketFromContent({
      nextId,
      employeeName: employee.name,
      docResults,
    })
  );

  // Ensure every finding has a recommendation tied to the rule (no generic overwrite)
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
    ? `Correct all ${errors} content-based finding(s) for ${employee.name} across ${
        displayNames.join(", ") || "imported documents"
      }.`
    : `No automated content findings for ${employee.name}. Retain the Form I-9 per policy.`;

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
      auditId: ctx.auditId || null,
      employeeId: employee.id,
      documentNames: displayNames,
      documentIds: docs.map((d) => d.id).filter(Boolean),
      analysisMethod: "document-content",
      extractions: extractionsByDocument,
      // Complete collection — Document Analysis must render every item
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
  const ctx = { auditId: audit.id, organizationName: audit.name };

  for (let i = 0; i < roster.length; i++) {
    if (signal?.aborted) throw new Error("Analysis cancelled");
    const emp = roster[i];
    onProgress?.({
      employeeName: emp.name,
      index: i,
      total,
      status: `Extracting & analyzing ${emp.name} (${i + 1}/${total || 1})`,
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

/** Complete findings list for an employee (no truncation). */
export function getAllFindings(employee) {
  const pack = employee?.findings;
  if (!pack) return [];
  if (Array.isArray(pack.all)) return [...pack.all];
  return [...(pack.section1 || []), ...(pack.section2 || []), ...(pack.documentReview || [])];
}

/** Findings for one live document id (same audit/employee packet). Strict document sync. */
export function getFindingsForDocument(employee, documentId) {
  const all = getAllFindings(employee);
  if (!documentId) {
    return all.filter((f) => !f.documentId);
  }
  return all.filter((f) => f.documentId === documentId);
}

/** Extraction snapshot for a document (from last analysis). */
export function getExtractionForDocument(employee, documentId) {
  const map = employee?.findings?.extractions || {};
  if (!documentId) return null;
  return map[documentId] || null;
}
