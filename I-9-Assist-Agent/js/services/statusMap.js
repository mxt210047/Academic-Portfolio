/**
 * Map live audit/employee analysis fields to display labels.
 * No Figma sample statuses — unknown values get a safe fallback.
 */

export function employeeStatusPresentation(employee, auditStatus) {
  const analysis = employee?.analysisStatus;
  const errors = Number(employee?.errors) || 0;

  if (analysis === "analyzing" || (auditStatus === "In Progress" && analysis !== "completed")) {
    return { key: "analyzing", label: "Analyzing…", badge: "badge-progress", meta: "Analyzing imported documents" };
  }
  if (analysis === "pending" || (!analysis && auditStatus === "Not Initiated")) {
    return { key: "pending", label: "Pending analysis", badge: "badge-muted", meta: "Awaiting Form I-9 analysis" };
  }
  if (analysis === "completed") {
    if (errors > 0) {
      return {
        key: "errors",
        label: `${errors} Errors Found`,
        badge: "badge-danger",
        meta: `${errors} Errors Found`,
        metaClass: "err",
      };
    }
    return {
      key: "clean",
      label: "No Errors Found",
      badge: "badge-ok",
      meta: "No Errors Found",
      metaClass: "",
    };
  }
  return { key: "unknown", label: "Status unavailable", badge: "badge-muted", meta: "Status unavailable" };
}

export function findingStatusLabel(status) {
  if (!status) return "unknown";
  const s = String(status).toLowerCase();
  if (s === "open") return "open";
  if (s === "in_remediation") return "in remediation";
  if (s === "resolved" || s === "closed") return s;
  return s;
}

export function severityLabel(severity) {
  if (!severity) return "unknown";
  const s = String(severity).toLowerCase();
  if (["high", "medium", "low", "info", "unknown"].includes(s)) return s;
  return s;
}
