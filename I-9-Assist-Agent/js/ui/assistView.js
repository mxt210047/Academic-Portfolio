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

export function renderAssistView({
  onBackToList,
  onBackToAudit,
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
  const docList = (emp.documents || []).join(", ") || "—";

  const sectionRows = (items) =>
    items.length
      ? items
          .map((f) => {
            const status = overrides[f.id] || f.status;
            return `
        <tr>
          <td><i class="swatch ${f.class === "technical" ? "tech" : "subst"}"></i> <strong>${escapeHtml(
            f.title
          )}</strong><div class="note">Status: ${escapeHtml(status)}</div></td>
          <td>${escapeHtml(f.detail)}</td>
        </tr>`;
          })
          .join("")
      : `<tr><td colspan="2">No findings in this section yet.</td></tr>`;

  const statusMeta = emp.errors
    ? `<span class="err">${emp.errors} Errors Found</span>`
    : `<span>No errors recorded yet</span>`;

  const dateMeta = emp.completedOn
    ? `Audit Completed on ${formatDisplayDate(emp.completedOn)}`
    : "Awaiting Form I-9 analysis";

  const root = el(`
  <section>
    <div class="crumbs">
      <button type="button" data-list>I-9 Audits</button> &gt;
      <button type="button" data-audit>${escapeHtml(emp.name)}</button>
    </div>
    <div class="page-title-row">
      <div>
        <h1 class="page-title">${escapeHtml(emp.name)}'s I-9 Audit Notes</h1>
        <div class="meta">
          ${dateMeta} • ${statusMeta}
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="chip-btn" type="button" title="Share">↗</button>
        <button class="btn btn-primary btn-sm" type="button" data-download>DOWNLOAD</button>
      </div>
    </div>
    <div class="split">
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
            <tr><td>Purpose</td><td>${escapeHtml(pack.purpose)}</td></tr>
            <tr><td>Department</td><td>${escapeHtml(emp.department || "—")}</td></tr>
            <tr><td>Reviewed By</td><td>${escapeHtml(pack.reviewedBy)}</td></tr>
            <tr><td>Organization</td><td>${escapeHtml(audit?.name || "—")}</td></tr>
            <tr><td>Imported Documents</td><td>${escapeHtml(docList)}</td></tr>
          </table>
          <p style="font-size:13px;line-height:1.5;color:#374151">
            Review steps: 1) Review &amp; Identify Errors, 2) Review Completeness, 3) Report issues requiring remediation.
          </p>
          <div class="legend">
            <span><i class="swatch tech"></i> Technical errors (correctable with initials/date)</span>
            <span><i class="swatch subst"></i> Substantive errors (usually requiring explanation or new I-9)</span>
          </div>
          <h4>Section-1 Errors</h4>
          <table class="err-table">
            <thead><tr><th>Errors</th><th>Error details</th></tr></thead>
            <tbody>${sectionRows(pack.section1)}</tbody>
          </table>
          <div class="rec-box">
            <div class="warn">${escapeHtml(pack.recommendation)}</div>
            <ul>
              <li>Enter N/A in unused Section 1 fields where appropriate.</li>
              <li>Do not backdate signatures; use the actual correction date with initials.</li>
              <li>Ensure attestation citizenship/immigration status is checked correctly.</li>
            </ul>
          </div>
          <h4>Section 2 Errors</h4>
          <table class="err-table">
            <thead><tr><th>Errors</th><th>Error details</th></tr></thead>
            <tbody>${sectionRows(pack.section2)}</tbody>
          </table>
        </div>
      </section>

      <aside class="assist">
        ${state.agentBusy && state.agentStatus ? statusBar(state.agentStatus) : ""}
        ${state.chatStarted ? chatPanel(state) : idlePanel()}
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
  root.querySelector("[data-download]")?.addEventListener("click", () => {
    const blob = new Blob(
      [
        `I-9 Audit Notes\nEmployee: ${emp.name}\nDocuments: ${docList}\nErrors: ${emp.errors}\nRecommendation: ${pack.recommendation}\n`,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${emp.name.replaceAll(" ", "_")}_I9_Audit_Notes.txt`;
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

function idlePanel() {
  return `
  <div class="assist-idle" id="assist-idle">
    ${icons.assistArt}
    <p>Ask <strong>OnBlick Audit Assistant</strong> to help you correct this employee's Form I-9 based on the errors identified in the audit.</p>
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
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
