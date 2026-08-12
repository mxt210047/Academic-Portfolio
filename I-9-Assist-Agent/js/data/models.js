/**
 * Domain helpers for audits built from packages in mockData.js
 * (populated only by user imports).
 */

import { currentUser } from "./mockData.js";

export { currentUser };

export function emptyFindings() {
  return {
    purpose: "Form I-9 corrections",
    reviewedBy: "—",
    all: [],
    section1: [],
    section2: [],
    documentReview: [],
    recommendation:
      "Analysis has not run yet for this employee. Initiate the audit to analyze the imported Form I-9 packet.",
  };
}

export function getFindingsForEmployee(employee) {
  if (!employee) return emptyFindings();
  return employee.findings || emptyFindings();
}

/** Build an audit record from an import package held in mockData. */
export function buildAuditFromImport(pkg, orgName) {
  const now = new Date();
  const roster = (pkg.employees || []).map((e, i) => {
    const docs = (e.documents || []).map((d) =>
      typeof d === "string"
        ? { id: null, name: d }
        : { id: d.id, name: d.name, relativePath: d.relativePath, size: d.size }
    );
    const documentIds = e.documentIds || docs.map((d) => d.id).filter(Boolean);
    return {
      id: `emp-${pkg.id}-${i}`,
      name: e.name,
      department: e.department || "",
      docs: docs.length || e.documentCount || 0,
      errors: 0,
      documents: docs,
      documentIds,
      auditDate: null,
      completedOn: null,
      analysisStatus: "pending", // pending | analyzing | completed
      findings: emptyFindings(),
    };
  });

  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: orgName,
    folderId: pkg.id,
    folderName: pkg.name,
    employees: roster.length,
    documents: pkg.documentCount,
    source: pkg.source || "upload",
    fileNames: pkg.fileNames || [],
    documentIds: pkg.documentIds || roster.flatMap((r) => r.documentIds),
    roster,
    status: "Not Initiated",
    initiatedAt: null,
    initiatedBy: null,
    createdAt: now.toISOString(),
  };
}

export function formatDisplayDate(isoOrDate) {
  if (!isoOrDate) return "—";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
