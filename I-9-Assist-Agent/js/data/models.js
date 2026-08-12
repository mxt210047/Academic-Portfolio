/**
 * Domain helpers for audits built from user imports.
 * No seeded employees, folders, or findings.
 */

export const currentUser = {
  id: "session-user",
  name: "Signed-in user",
  initials: "SU",
  role: "HR",
};

export function emptyFindings() {
  return {
    purpose: "Form I-9 corrections",
    reviewedBy: "—",
    section1: [],
    section2: [],
    recommendation:
      "No findings yet. Documents were imported; run the OnBlick audit engine (or connect the AI audit API) to analyze Form I-9 content.",
  };
}

export function getFindingsForEmployee(employee) {
  if (!employee) return emptyFindings();
  return employee.findings || emptyFindings();
}

/** Build an audit record from an imported package (files/folders only). */
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
      department: "",
      docs: docs.length || e.documentCount || 0,
      errors: 0,
      documents: docs,
      documentIds,
      auditDate: null,
      completedOn: null,
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
    status: "Not Initiated", // Not Initiated | In Progress | Completed
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
