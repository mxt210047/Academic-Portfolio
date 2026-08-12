/**
 * Local Form I-9 packet analysis over imported documents.
 * Emits a complete findings[] collection keyed to documentId for Document Analysis.
 */

import { getImportedDocument } from "../data/mockData.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function docName(d) {
  return (typeof d === "string" ? d : d?.name || "").toLowerCase();
}

function looksLikeFormI9(name) {
  return /i-?9|form[_\s-]*i|employment[_\s-]*eligibility/.test(name);
}

function looksLikeSupportingId(name) {
  return /passport|license|licence|ssn|social|list[_\s-]?[abc]|work[_\s-]?auth|ead|green[_\s-]?card|visa|id[_\s-]?card|receipt/.test(
    name
  );
}

function severityFor(cls) {
  if (cls === "substantive") return "high";
  if (cls === "technical") return "medium";
  return "unknown";
}

function finding({ id, section, cls, title, detail, documentId, documentName, field = null }) {
  return {
    id,
    section,
    class: cls,
    severity: severityFor(cls),
    title,
    detail,
    status: "open",
    documentId: documentId || null,
    documentName: documentName || null,
    field,
    recommendation: null,
  };
}

/**
 * Analyze every imported document for an employee.
 * Returns complete findings with no truncation.
 */
export function analyzeEmployee(employee, ctx = {}) {
  const docs = (employee.documents || []).map((d) =>
    typeof d === "string" ? { id: null, name: d } : { id: d.id, name: d.name, relativePath: d.relativePath, size: d.size }
  );
  const now = new Date().toISOString();
  /** @type {ReturnType<typeof finding>[]} */
  const allFindings = [];
  let n = 0;
  const nextId = () => `f-${employee.id}-${++n}`;

  if (!docs.length) {
    allFindings.push(
      finding({
        id: nextId(),
        section: "Section 1",
        cls: "substantive",
        title: "No documents in packet",
        detail: `No files were imported for ${employee.name}. Re-import this employee's Form I-9 folder.`,
        documentId: null,
        documentName: null,
        field: "packet",
      })
    );
  } else {
    const names = docs.map((d) => docName(d));
    const hasI9 = names.some(looksLikeFormI9);
    const hasSupport = names.some(looksLikeSupportingId);
    const i9Docs = docs.filter((d) => looksLikeFormI9(docName(d)));
    const supportDocs = docs.filter((d) => looksLikeSupportingId(docName(d)));
    const receiptDocs = docs.filter((d) => /receipt/.test(docName(d)));

    // Per-document analysis — every finding is tied to a concrete documentId when available
    for (const d of docs) {
      const lower = docName(d);
      const meta = d.id ? getImportedDocument(d.id) : null;

      if (meta && (meta.kind === "text" || meta.type?.startsWith("text/")) && meta.size != null && meta.size < 40) {
        allFindings.push(
          finding({
            id: nextId(),
            section: "Section 1",
            cls: "technical",
            title: "Document appears empty or truncated",
            detail: `${d.name} is unusually small (${meta.sizeLabel || meta.size + " B"}). Re-scan or re-upload a complete page.`,
            documentId: d.id,
            documentName: d.name,
            field: "fileSize",
          })
        );
      }

      if (meta && meta.size === 0) {
        allFindings.push(
          finding({
            id: nextId(),
            section: "Document Review",
            cls: "substantive",
            title: "Empty file",
            detail: `${d.name} has zero bytes and cannot be analyzed.`,
            documentId: d.id,
            documentName: d.name,
            field: "fileSize",
          })
        );
      }
    }

    if (!hasI9) {
      for (const d of docs) {
        allFindings.push(
          finding({
            id: nextId(),
            section: "Section 1",
            cls: "substantive",
            title: "Form I-9 not identified",
            detail: `${d.name} is part of ${employee.name}'s packet, but no Form I-9 filename was found among imported files (${docs
              .map((x) => x.name)
              .join(", ")}).`,
            documentId: d.id,
            documentName: d.name,
            field: "formI9",
          })
        );
      }
    } else {
      // Only flag unrecognized types when a Form I-9 already exists in the packet
      for (const d of docs) {
        const lower = docName(d);
        if (!looksLikeFormI9(lower) && !looksLikeSupportingId(lower)) {
          allFindings.push(
            finding({
              id: nextId(),
              section: "Document Review",
              cls: "technical",
              title: "Unrecognized document type",
              detail: `${d.name} for ${employee.name} is not recognized as Form I-9 or a List A/B/C supporting document from its filename.`,
              documentId: d.id,
              documentName: d.name,
              field: "filename",
            })
          );
        }
      }
    }

    if (hasI9 && !hasSupport && docs.length < 2) {
      for (const d of i9Docs) {
        allFindings.push(
          finding({
            id: nextId(),
            section: "Section 2",
            cls: "technical",
            title: "Supporting List A/B/C document missing",
            detail: `Only ${d.name} appears in ${employee.name}'s packet. Attach the retained List A or List B+C supporting copy.`,
            documentId: d.id,
            documentName: d.name,
            field: "supportingDocuments",
          })
        );
      }
    }

    if (receiptDocs.length && !docs.some((d) => /replacement|follow.?up|passport|license|ssn/.test(docName(d)))) {
      for (const d of receiptDocs) {
        allFindings.push(
          finding({
            id: nextId(),
            section: "Section 2",
            cls: "substantive",
            title: "Receipt follow-up not documented",
            detail: `${d.name} indicates a receipt was accepted for ${employee.name}, but no replacement identity document was imported.`,
            documentId: d.id,
            documentName: d.name,
            field: "receipt",
          })
        );
      }
    }

    // If Form I-9 present with support and no other issues, leave clean (0 findings)
    // If docs exist but nothing flagged and not a clean I-9+support pair, add per-doc review note
    if (!allFindings.length && docs.length && !(hasI9 && docs.length >= 2 && hasSupport) && !(hasI9 && hasSupport)) {
      for (const d of docs) {
        allFindings.push(
          finding({
            id: nextId(),
            section: "Section 2",
            cls: "technical",
            title: "Manual completeness review recommended",
            detail: `Analyzed ${d.name} for ${employee.name}. Field-level OCR is not connected; confirm Section 1/2 completeness on the retained scan.`,
            documentId: d.id,
            documentName: d.name,
            field: "completeness",
          })
        );
      }
    }
  }

  // Attach recommendation text onto each finding (live, not invented beyond rule text)
  for (const f of allFindings) {
    f.recommendation = `Address “${f.title}” on ${f.documentName || "the packet"} without backdating; initial and date with today's date.`;
  }

  const section1 = allFindings.filter((f) => f.section === "Section 1");
  const section2 = allFindings.filter((f) => f.section === "Section 2");
  const documentReview = allFindings.filter((f) => f.section === "Document Review");
  const displayNames = docs.map((d) => d.name);
  const errors = allFindings.length;

  const recommendation = errors
    ? `Correct all ${errors} finding(s) for ${employee.name} across ${displayNames.join(", ") || "imported documents"}.`
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
      auditId: ctx.auditId || null,
      employeeId: employee.id,
      documentNames: displayNames,
      documentIds: docs.map((d) => d.id).filter(Boolean),
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
      status: `Analyzing ${emp.name} (${i + 1}/${total || 1})`,
    });
    await delay(200 + Math.min(300, (emp.docs || 1) * 40));
    if (signal?.aborted) throw new Error("Analysis cancelled");
    nextRoster.push(analyzeEmployee({ ...emp, analysisStatus: "analyzing" }, ctx));
  }

  onProgress?.({
    employeeName: null,
    index: total,
    total,
    status: "Finalizing audit results",
  });
  await delay(120);

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

/** Findings for one live document id (same audit/employee packet). */
export function getFindingsForDocument(employee, documentId) {
  const all = getAllFindings(employee);
  if (!documentId) return all;
  return all.filter((f) => f.documentId === documentId || f.documentId == null);
}
