import { el } from "../utils/dom.js";
import {
  getSelectedAudit,
  getSelectedEmployee,
  getState,
} from "../state/store.js";
import {
  formatDisplayDate,
  getFindingsForEmployee,
} from "../data/models.js";
import { getImportedDocument, getImportedDocuments } from "../services/documentStore.js";
import {
  getAllFindings,
  getExtractionForDocument,
  getFindingsForDocument,
} from "../services/auditAnalysis.js";
import {
  employeeStatusPresentation,
  findingStatusLabel,
} from "../services/statusMap.js";
import { renderDocumentPreview } from "./documentPreview.js";
import { renderAiAgentPanel } from "./aiAgentPanel.js";
import { renderAiAgentWidget } from "./aiAgentWidget.js";

/**
 * Document Analysis / Audit Notes — live document viewer + complete findings
 * for the currently selected document on the selected employee.
 * AI Assist Agent widget is page-specific (launcher → existing agent panel).
 */
export function renderAssistView({
  onBackToList,
  onBackToAudit,
  onOpenDocument,
  onSelectAnalysisDocument,
  onOpenAgent,
  onCloseAgent,
  onStartCorrection,
  onSend,
  onApprove,
  onReject,
  onRegenerate,
}) {
  const state = getState();
  const emp = getSelectedEmployee();
  const audit = getSelectedAudit();
  if (!emp) {
    return el(`<section><p class="note">Select an employee from an imported audit.</p></section>`);
  }

  const pack = getFindingsForEmployee(emp);
  const overrides = state.findingOverrides;
  const allFindings = getAllFindings(emp);
  const liveDocs = getImportedDocuments(emp.documentIds || []);
  const selectedDocId =
    state.selectedDocumentId && (emp.documentIds || []).includes(state.selectedDocumentId)
      ? state.selectedDocumentId
      : emp.documentIds?.[0] || null;
  const selectedDoc = selectedDocId ? getImportedDocument(selectedDocId) : null;

  // Findings synchronized to the displayed document (complete list, no slice)
  const docFindings = getFindingsForDocument(emp, selectedDocId);
  const docFindingCount = docFindings.length;
  const extraction = getExtractionForDocument(emp, selectedDocId);
  const section1 = docFindings.filter((f) => f.section === "Section 1");
  const section2 = docFindings.filter((f) => f.section === "Section 2");
  const docReview = docFindings.filter((f) => f.section === "Document Review");
  const otherSections = docFindings.filter(
    (f) => f.section !== "Section 1" && f.section !== "Section 2" && f.section !== "Document Review"
  );
  // Count integrity: grouped rows must equal full document finding list
  const groupedCount = section1.length + section2.length + docReview.length + otherSections.length;

  const packetStatus = employeeStatusPresentation(emp, audit?.status);
  const docStatusLabel =
    emp.analysisStatus !== "completed"
      ? packetStatus.label
      : docFindingCount
        ? `${docFindingCount} Errors Found`
        : "No Errors Found";

  const sectionRows = (items) =>
    items.length
      ? items
          .map((f) => {
            const st = findingStatusLabel(overrides[f.id] || f.status);
            return `
        <tr data-finding-id="${escapeAttr(f.id)}" data-document-id="${escapeAttr(f.documentId || "")}">
          <td>
            <i class="swatch ${f.class === "technical" ? "tech" : "subst"}"></i>
            <strong>${escapeHtml(f.title)}</strong>
            <div class="note">
              ${escapeHtml(f.severity || f.class || "—")} · Status: ${escapeHtml(st)}
              ${f.field ? ` · Field: ${escapeHtml(f.field)}` : ""}
            </div>
          </td>
          <td>
            ${escapeHtml(f.detail)}
            ${
              f.detectedValue != null && f.detectedValue !== ""
                ? `<div class="note">Detected: ${escapeHtml(String(f.detectedValue))}</div>`
                : ""
            }
            ${f.recommendation ? `<div class="note">${escapeHtml(f.recommendation)}</div>` : ""}
          </td>
        </tr>`;
          })
          .join("")
      : `<tr><td colspan="2">${
          emp.analysisStatus === "completed"
            ? "No findings in this section for the selected document."
            : "No findings in this section yet."
        }</td></tr>`;

  /** Figma-style recommendation box under each section — content from live findings only */
  const sectionRecBox = (sectionFindings, sectionLabel) => {
    if (!sectionFindings.length) {
      return `
          <div class="rec-box">
            <div class="warn">${
              emp.analysisStatus === "completed"
                ? `No open remediation items for ${escapeHtml(sectionLabel)} on this document.`
                : `Complete analysis to populate ${escapeHtml(sectionLabel)} remediation.`
            }</div>
            <ul><li>Retain Form I-9 records per policy.</li></ul>
          </div>`;
    }
    const who =
      sectionLabel === "Section 1"
        ? "Only the employee is required to make the necessary corrections on Section 1 of the I-9."
        : sectionLabel === "Section 2"
          ? "Only the employer or authorized representative should correct Section 2 of the I-9."
          : `Address the ${sectionFindings.length} finding(s) listed for ${sectionLabel}.`;
    const items = sectionFindings
      .map(
        (f) =>
          `<li><strong>${escapeHtml(f.title)}</strong>${
            f.recommendation
              ? `: ${escapeHtml(f.recommendation)}`
              : `: ${escapeHtml(f.detail)}`
          }</li>`
      )
      .join("");
    return `
          <div class="rec-box">
            <div class="warn">${escapeHtml(who)}</div>
            <ul>${items}</ul>
          </div>`;
  };

  const root = el(`
  <section data-employee-id="${escapeAttr(emp.id)}" data-audit-id="${escapeAttr(audit?.id || "")}" data-document-id="${escapeAttr(
    selectedDocId || ""
  )}">
    <div class="crumbs">
      <button type="button" data-list>I-9 Audits</button> &gt;
      <button type="button" data-audit>${escapeHtml(emp.name)}</button>
    </div>
    <div class="page-title-row">
      <div>
        <h1 class="page-title">${escapeHtml(emp.name)}'s I-9 Audit Notes</h1>
        <div class="meta">
          ${
            emp.completedOn
              ? `Audit Completed on ${formatDisplayDate(emp.completedOn)}`
              : escapeHtml(packetStatus.meta)
          } •
          <span class="${docFindingCount ? "err" : ""}">${escapeHtml(docStatusLabel)}</span>
          <span class="note"> · Packet total: ${allFindings.length}</span>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="chip-btn" type="button" data-share title="Share">↗</button>
        <button class="btn btn-primary btn-sm" type="button" data-download>DOWNLOAD</button>
      </div>
    </div>
    <div class="split analysis-split ${state.agentPanelOpen ? "" : "agent-collapsed"}">
      <section class="editor">
        <div class="editor-toolbar" aria-label="Formatting">
          ${["B","I","U","•","1.","≡","A","🖍","{}","#"].map((t) => `<button type="button">${t}</button>`).join("")}
        </div>
        <div class="editor-body">
          <div class="doc-meta"><span>Audit Notes/Report</span><span>Audit Date: ${formatDisplayDate(
            emp.auditDate
          )}</span></div>
          <table class="info-table">
            <tr><td>Employee Name</td><td>${escapeHtml(emp.name)}</td></tr>
            <tr><td>Purpose</td><td>${escapeHtml(pack.purpose || "Form I-9 corrections")}</td></tr>
            <tr><td>Department</td><td>${escapeHtml(
              emp.department || (audit?.name ? `${audit.name} (Form I-9 Review)` : "—")
            )}</td></tr>
            <tr><td>Reviewed By</td><td>${escapeHtml(pack.reviewedBy || "—")}</td></tr>
          </table>
          <table class="info-table analysis-doc-meta">
            <tr><td>Organization</td><td>${escapeHtml(audit?.name || "—")}</td></tr>
            <tr><td>Document under analysis</td><td>${escapeHtml(selectedDoc?.name || "—")}</td></tr>
            <tr><td>Document ID</td><td>${escapeHtml(selectedDocId || "—")}</td></tr>
            <tr><td>Findings on this document</td><td><strong>${
              emp.analysisStatus === "completed" ? docFindingCount : "—"
            }</strong> <span class="note">(packet total ${allFindings.length})</span></td></tr>
            <tr><td>Content classification</td><td>${escapeHtml(extraction?.classification || "—")}</td></tr>
            <tr><td>Extraction method</td><td>${escapeHtml(
              extraction
                ? `${extraction.method || "—"} · ${extraction.charCount ?? 0} chars${
                    extraction.ok ? "" : " · incomplete"
                  }`
                : emp.analysisStatus === "completed"
                  ? "—"
                  : "Pending analysis"
            )}</td></tr>
          </table>
          ${
            extraction?.textPreview
              ? `<p class="note" data-extraction-preview>Extracted text preview: ${escapeHtml(
                  extraction.textPreview
                )}${extraction.charCount > 280 ? "…" : ""}</p>`
              : extraction?.uncertainty
                ? `<p class="note" data-extraction-preview>${escapeHtml(extraction.uncertainty)}</p>`
                : ""
          }
          ${
            extraction?.fields && Object.keys(extraction.fields).length
              ? `<table class="info-table analysis-extracted-fields">
            <tr><td colspan="2"><strong>Detected field values (from document content)</strong></td></tr>
            ${Object.entries(extraction.fields)
              .filter(([, v]) => v != null && v !== "" && v !== false)
              .map(
                ([k, v]) =>
                  `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(
                    typeof v === "boolean" ? (v ? "yes" : "no") : String(v)
                  )}</td></tr>`
              )
              .join("")}
          </table>`
              : ""
          }
          <p style="font-size:13px;line-height:1.5;color:#374151">
            The Form I-9 for the above-mentioned employee has been reviewed as stated below:
          </p>
          <ol style="font-size:13px;line-height:1.5;color:#374151;margin:0 0 14px;padding-left:18px">
            <li>Review &amp; Identify Errors</li>
            <li>Review Completeness</li>
            <li>Report issues requiring remediation</li>
          </ol>

          <div class="analysis-doc-block">
            <h4>Live document</h4>
            <div class="analysis-doc-rail">
              ${
                liveDocs.length
                  ? liveDocs
                      .map((d) => {
                        const count = getFindingsForDocument(emp, d.id).length;
                        return `<button type="button" class="chip-btn ${
                          d.id === selectedDocId ? "active" : ""
                        }" data-analysis-doc="${d.id}">${escapeHtml(d.name)} (${count})</button>`;
                      })
                      .join("")
                  : `<span class="note">No imported documents for this employee.</span>`
              }
            </div>
            <div class="analysis-doc-stage" data-bound-document-id="${escapeAttr(selectedDocId || "")}">
              ${
                !emp.documentIds?.length
                  ? `<div class="doc-fallback"><h2>No document in packet</h2><p class="note">This employee has no imported files.</p></div>`
                  : selectedDoc
                    ? renderDocumentPreview(selectedDoc)
                    : `<div class="doc-fallback"><h2>Document preview unavailable</h2><p class="note">Document id ${escapeHtml(
                        selectedDocId || "—"
                      )} is not in the live import registry (file may have been revoked).</p></div>`
              }
            </div>
            ${
              selectedDoc
                ? `<div class="note" style="margin-top:8px">
                    <a class="linkish" href="${selectedDoc.url}" download="${escapeAttr(selectedDoc.name)}">Download</a>
                    · <a class="linkish" href="${selectedDoc.url}" target="_blank" rel="noopener">Open in new tab</a>
                    · <button type="button" class="linkish" data-open-full="${selectedDoc.id}">Open full document page</button>
                  </div>`
                : ""
            }
          </div>

          <div class="legend">
            <span><i class="swatch tech"></i> Technical errors (correctable with initials/date)</span>
            <span><i class="swatch subst"></i> Substantive errors (usually requiring explanation or new I-9)</span>
          </div>

          <h4>Section-1 Errors (${section1.length})</h4>
          <div class="findings-scroll">
            <table class="err-table">
              <thead><tr><th>Errors</th><th>Error details</th></tr></thead>
              <tbody>${sectionRows(section1)}</tbody>
            </table>
          </div>
          ${sectionRecBox(section1, "Section 1")}

          <h4>Section 2 Errors (${section2.length})</h4>
          <div class="findings-scroll">
            <table class="err-table">
              <thead><tr><th>Errors</th><th>Error details</th></tr></thead>
              <tbody>${sectionRows(section2)}</tbody>
            </table>
          </div>
          ${sectionRecBox(section2, "Section 2")}

          <h4>Document Review (${docReview.length})</h4>
          <div class="findings-scroll">
            <table class="err-table">
              <thead><tr><th>Errors</th><th>Error details</th></tr></thead>
              <tbody>${sectionRows(docReview)}</tbody>
            </table>
          </div>
          ${sectionRecBox(docReview, "Document Review")}
          ${
            otherSections.length
              ? `<h4>Other (${otherSections.length})</h4>
          <div class="findings-scroll">
            <table class="err-table">
              <thead><tr><th>Errors</th><th>Error details</th></tr></thead>
              <tbody>${sectionRows(otherSections)}</tbody>
            </table>
          </div>
          ${sectionRecBox(otherSections, "Other")}`
              : ""
          }
          <p class="note" data-count-check="doc-findings">
            Showing ${docFindingCount} finding(s) for this document
            ${groupedCount === docFindingCount ? "" : ` (group mismatch ${groupedCount})`}.
            Packet total: ${allFindings.length}.
          </p>
        </div>
      </section>
      <div class="assist-slot" data-assist-slot></div>
    </div>
  </section>`);

  const slot = root.querySelector("[data-assist-slot]");
  if (state.agentPanelOpen && slot) {
    slot.appendChild(
      renderAiAgentPanel({
        employeeName: emp.name,
        documentName: selectedDoc?.name || null,
        docFindingCount,
        auditId: audit?.id || pack.auditId || null,
        employeeId: emp.id,
        documentId: selectedDocId,
        agentBusy: state.agentBusy,
        agentStatus: state.agentStatus,
        chatStarted: state.chatStarted,
        messages: state.messages,
        onClose: onCloseAgent,
        onMinimize: onCloseAgent,
        onStartCorrection,
        onSend,
        onApprove,
        onReject,
        onRegenerate,
        onFeedback: () =>
          alert("Thank you — feedback for OnBlick Audit Assistant can be shared with your OnBlick administrator."),
      })
    );
  } else {
    // Page-specific widget launcher (Document Analysis only) when panel is closed
    root.appendChild(
      renderAiAgentWidget({
        employeeName: emp.name,
        documentName: selectedDoc?.name || null,
        documentId: selectedDocId,
        docFindingCount,
        onOpen: onOpenAgent,
      })
    );
  }

  root.querySelector("[data-list]").addEventListener("click", onBackToList);
  root.querySelector("[data-audit]").addEventListener("click", onBackToAudit);
  root.querySelectorAll("[data-analysis-doc]").forEach((btn) =>
    btn.addEventListener("click", () => onSelectAnalysisDocument(btn.getAttribute("data-analysis-doc")))
  );
  root.querySelector("[data-open-full]")?.addEventListener("click", () =>
    onOpenDocument(root.querySelector("[data-open-full]").getAttribute("data-open-full"))
  );
  root.querySelector("[data-download]")?.addEventListener("click", () => {
    const lines = docFindings
      .map(
        (f) =>
          `- [${f.section}] (${f.severity}/${f.class}) ${f.title}: ${f.detail} [doc=${f.documentName || f.documentId || "packet"}]`
      )
      .join("\n");
    const blob = new Blob(
      [
        `I-9 Document Analysis\nAudit: ${pack.auditId || audit?.id}\nEmployee: ${emp.name}\nDocument: ${
          selectedDoc?.name || "—"
        }\nDocument ID: ${selectedDocId || "—"}\nFindings on document: ${docFindingCount}\nPacket findings: ${
          allFindings.length
        }\n\n${lines || "(none)"}\n`,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(selectedDoc?.name || emp.name).replaceAll(" ", "_")}_analysis.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });
  root.querySelector("[data-share]")?.addEventListener("click", async () => {
    const summary = `${emp.name}'s I-9 Audit Notes — ${selectedDoc?.name || "packet"} — ${docFindingCount} finding(s)`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
        alert(`Copied summary to clipboard:\n\n${summary}`);
      } else {
        alert(summary);
      }
    } catch {
      alert(summary);
    }
  });
  return root;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', "&quot;");
}
