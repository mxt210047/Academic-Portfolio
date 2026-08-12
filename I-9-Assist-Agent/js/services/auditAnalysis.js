/**
 * Local Form I-9 packet analysis over imported documents.
 * Uses only the selected audit's roster + files registered in mockData.js.
 * Swap analyzeEmployee body for a real OnBlick/parsing API later.
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

function finding(id, section, cls, title, detail) {
  return { id, class: cls, title, detail, status: "open", section };
}

/**
 * Analyze one employee packet from imported documents only.
 */
export function analyzeEmployee(employee) {
  const docs = employee.documents || [];
  const names = docs.map(docName);
  const section1 = [];
  const section2 = [];
  const now = new Date().toISOString();
  let n = 0;
  const id = () => `f-${employee.id}-${++n}`;

  if (!docs.length) {
    section1.push(
      finding(
        id(),
        "Section 1",
        "substantive",
        "No documents in packet",
        `No files were imported for ${employee.name}. Re-import this employee's Form I-9 folder.`
      )
    );
  } else {
    const hasI9 = names.some(looksLikeFormI9);
    const hasSupport = names.some(looksLikeSupportingId);

    if (!hasI9) {
      section1.push(
        finding(
          id(),
          "Section 1",
          "substantive",
          "Form I-9 not identified",
          `Imported files (${names.join(", ") || "none"}) do not include a clear Form I-9 filename. Rename or add the Form I-9 scan.`
        )
      );
    }

    if (hasI9 && !hasSupport && docs.length < 2) {
      section2.push(
        finding(
          id(),
          "Section 2",
          "technical",
          "Supporting List A/B/C document missing",
          "Only the Form I-9 appears in this packet. Attach the retained List A or List B+C supporting copy."
        )
      );
    }

    if (names.some((n) => /receipt/.test(n)) && !names.some((n) => /replacement|follow.?up|passport|license|ssn/.test(n))) {
      section2.push(
        finding(
          id(),
          "Section 2",
          "substantive",
          "Receipt follow-up not documented",
          "A receipt file is present but no replacement identity document was imported with this packet."
        )
      );
    }

    // Inspect text bodies when available (text imports / readable blobs)
    for (const d of docs) {
      const meta = d?.id ? getImportedDocument(d.id) : null;
      if (!meta || (meta.kind !== "text" && !meta.type?.startsWith("text/"))) continue;
      // Structural note only — binary PDF OCR is out of scope without parsing API
      if (meta.size != null && meta.size < 40) {
        section1.push(
          finding(
            id(),
            "Section 1",
            "technical",
            "Document appears empty or truncated",
            `${meta.name} is unusually small (${meta.sizeLabel || meta.size + " B"}). Re-scan or re-upload a complete page.`
          )
        );
      }
    }

    if (hasI9 && docs.length >= 2 && !section1.length && !section2.length) {
      // Clean packet relative to available local checks
    } else if (!section1.length && !section2.length && docs.length) {
      section2.push(
        finding(
          id(),
          "Section 2",
          "technical",
          "Manual completeness review recommended",
          `Analyzed ${docs.length} imported file(s) for ${employee.name}. No automated Form I-9 field OCR is connected yet; confirm Section 1/2 completeness on the retained scans.`
        )
      );
    }
  }

  const errors = section1.length + section2.length;
  const recommendation = errors
    ? `Correct ${errors} finding(s) for ${employee.name} using the imported packet, then initial and date changes with today's date (do not backdate).`
    : `No automated findings for ${employee.name}. Retain the Form I-9 per policy and re-run when the full parsing API is connected.`;

  return {
    ...employee,
    errors,
    analysisStatus: "completed",
    auditDate: now.slice(0, 10),
    completedOn: now,
    findings: {
      purpose: "Form I-9 corrections",
      reviewedBy: "OnBlick Audit Agent (local analysis)",
      section1,
      section2,
      recommendation,
    },
  };
}

/**
 * Run analysis across an audit roster. Calls onProgress(employeeName, index, total).
 */
export async function analyzeAudit(audit, { onProgress } = {}) {
  const roster = audit.roster || [];
  const total = roster.length;
  const nextRoster = [];

  for (let i = 0; i < roster.length; i++) {
    const emp = roster[i];
    onProgress?.({
      employeeName: emp.name,
      index: i,
      total,
      status: `Analyzing ${emp.name} (${i + 1}/${total || 1})`,
    });
    // Mark analyzing briefly in caller via progress; simulate work per packet size
    await delay(280 + Math.min(400, (emp.docs || 1) * 60));
    nextRoster.push(analyzeEmployee({ ...emp, analysisStatus: "analyzing" }));
  }

  onProgress?.({
    employeeName: null,
    index: total,
    total,
    status: "Finalizing audit results",
  });
  await delay(220);

  return {
    ...audit,
    roster: nextRoster,
    status: "Completed",
    completedAt: new Date().toISOString(),
  };
}
