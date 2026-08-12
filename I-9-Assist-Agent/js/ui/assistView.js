import { el, icons } from "../utils/dom.js";
import {
  getSelectedAudit,
  getSelectedEmployee,
  getState,
} from "../state/store.js";
import {
  formatDisplayDate,
  getFindingsForEmployee,
} from "../data/models.js";
import { getImportedDocument, getImportedDocuments } from "../data/mockData.js";
import {
  getAllFindings,
  getFindingsForDocument,
} from "../services/auditAnalysis.js";
import {
  employeeStatusPresentation,
  findingStatusLabel,
} from "../services/statusMap.js";
import { renderDocumentPreview } from "./documentPreview.js";

/**
 * Document Analysis / Audit Notes — live document viewer + complete findings
 * for the currently selected document on the selected employee.
 */
export function renderAssistView({
  onBackToList,
  onBackToAudit,
  onOpenDocument,
  onSelectAnalysisDocument,
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
  const section1 = docFindings.filter((f) => f.section === "Section 1");
  const section2 = docFindings.filter((f) => f.section === "Section 2");
  const docReview = docFindings.filter((f) => f.section === "Document Review");

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

  const remediationItems = docFindings.length
    ? docFindings
        .map(
          (f) =>
            `<li><strong>${escapeHtml(f.title)}</strong> (${escapeHtml(f.section)} · ${escapeHtml(
              f.severity || f.class
            )}): ${escapeHtml(f.detail)}</li>`
        )
        .join("")
    : `<li>${
        emp.analysisStatus === "completed"
          ? "No open remediation items for this document."
          : "Initiate and complete analysis to populate remediation items."
      }</li>`;

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
        <button class="chip-btn" type="button" title="Share">↗</button>
        <button class="btn btn-primary btn-sm" type="button" data-download>DOWNLOAD</button>
      </div>
    </div>
    <div class="split analysis-split">
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
            <tr><td>Employee ID</td><td>${escapeHtml(emp.id)}</td></tr>
            <tr><td>Audit ID</td><td>${escapeHtml(pack.auditId || audit?.id || "—")}</td></tr>
            <tr><td>Document</td><td>${escapeHtml(selectedDoc?.name || "—")}</td></tr>
            <tr><td>Document ID</td><td>${escapeHtml(selectedDocId || "—")}</td></tr>
            <tr><td>Organization</td><td>${escapeHtml(audit?.name || "—")}</td></tr>
            <tr><td>Findings on this document</td><td><strong>${
              emp.analysisStatus === "completed" ? docFindingCount : "—"
            }</strong></td></tr>
            <tr><td>Reviewed By</td><td>${escapeHtml(pack.reviewedBy || "—")}</td></tr>
          </table>

          <div class="analysis-doc-block">
            <h4>Document under analysis</h4>
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
                selectedDoc
                  ? renderDocumentPreview(selectedDoc)
                  : `<div class="doc-fallback"><h2>No document selected</h2><p class="note">Import files and open an employee after analysis.</p></div>`
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

          <div class="rec-box">
            <div class="warn">${escapeHtml(
              docFindings.length
                ? `This document has ${docFindingCount} finding(s). ${pack.recommendation || ""}`
                : pack.recommendation || "—"
            )}</div>
            <ul>${remediationItems}</ul>
          </div>

          <h4>Section 2 Errors (${section2.length})</h4>
          <div class="findings-scroll">
            <table class="err-table">
              <thead><tr><th>Errors</th><th>Error details</th></tr></thead>
              <tbody>${sectionRows(section2)}</tbody>
            </table>
          </div>

          <h4>Document Review (${docReview.length})</h4>
          <div class="findings-scroll">
            <table class="err-table">
              <thead><tr><th>Errors</th><th>Error details</th></tr></thead>
              <tbody>${sectionRows(docReview)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <aside class="assist">
        ${state.agentBusy && state.agentStatus ? statusBar(state.agentStatus) : ""}
        ${state.chatStarted ? chatPanel(state) : idlePanel(emp.name, docFindingCount, selectedDoc?.name)}
        <div class="composer">
          <div class="composer-row">
            <input id="ask" placeholder="Ask your question" ${state.agentBusy ? "disabled" : ""} />
            <button class="icon-btn" type="button" title="Voice" aria-label="Voice" disabled>🎤</button>
            <button class="send" id="send" type="button" title="Send" aria-label="Send" ${
              state.agentBusy ? "disabled" : ""
            }>↑</button>
          </div>
          <div class="disclaimer">OnBlick Assistant may make mistakes. Please review its responses carefully. <a href="#">Share your feedback</a></div>
        </div>
      </aside>
    </div>
  </section>`);

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
  root.querySelector("#start-correction")?.addEventListener("click", onStartCorrection);
  root.querySelector("#send")?.addEventListener("click", () => {
    const input = root.querySelector("#ask");
    onSend(input?.value || "");
  });
  root.querySelector("#ask")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSend(e.target.value || "");
  });
  root.querySelector("[data-approve]")?.addEventListener("click", onApprove);
  root.querySelector("[data-reject]")?.addEventListener("click", onReject);
  root.querySelector("[data-regen]")?.addEventListener("click", onRegenerate);
  return root;
}

function statusBar(text) {
  return `<div class="assist-status"><span class="spinner" aria-hidden="true"></span>${escapeHtml(text)}</div>`;
}

function idlePanel(employeeName, docErrors, docName) {
  return `
  <div class="assist-idle" id="assist-idle">
    ${icons.assistArt}
    <p>Ask <strong>OnBlick Audit Assistant</strong> to help correct <strong>${escapeHtml(
      employeeName
    )}</strong>${docName ? `'s <strong>${escapeHtml(docName)}</strong>` : ""} based on the <strong>${
      Number(docErrors) || 0
    }</strong> finding(s) on this document.</p>
    <button class="btn btn-outline" type="button" id="start-correction">✨ Start Correction Recommendation</button>
  </div>`;
}

function chatPanel(state) {
  const msgs = state.messages
    .map((m) => {
      const actions =
        m.kind === "recommendation"
          ? `<div class="rec-actions">
              <button class="btn btn-primary btn-sm" type="button" data-approve>Approve</button>
              <button class="btn btn-danger-outline btn-sm" type="button" data-reject>Reject</button>
              <button class="btn btn-outline btn-sm" type="button" data-regen>Regenerate</button>
            </div>`
          : "";
      return `<div class="bubble ${m.role}">
        <span class="tag">${m.role === "bot" ? "OnBlick Audit Assistant" : "You"}</span>
        <div>${m.html || escapeHtml(m.text)}</div>
        ${actions}
      </div>`;
    })
    .join("");
  return `<div class="assist-chat" id="assist-chat">${msgs}</div>`;
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
