/**
 * OnBlick Audit Assistant panel — existing agent UI (idle / chat / composer).
 * Mounted from Document Analysis when the AI Agent widget opens it.
 * Uses live audit context from the caller (employee, document findings counts).
 */

import { el, icons } from "../utils/dom.js";

export function renderAiAgentPanel({
  employeeName,
  documentName,
  docFindingCount,
  auditId,
  employeeId,
  documentId,
  agentBusy,
  agentStatus,
  chatStarted,
  messages,
  onClose,
  onMinimize,
  onStartCorrection,
  onSend,
  onApprove,
  onReject,
  onRegenerate,
  onFeedback,
}) {
  const contextBits = [
    employeeName ? `Employee: ${employeeName}` : null,
    documentName ? `Document: ${documentName}` : null,
    Number.isFinite(docFindingCount) ? `${docFindingCount} finding(s)` : null,
  ].filter(Boolean);

  const root = el(`
  <aside class="assist ai-agent-panel" data-ai-agent-panel
    data-audit-id="${escapeAttr(auditId || "")}"
    data-employee-id="${escapeAttr(employeeId || "")}"
    data-document-id="${escapeAttr(documentId || "")}">
    <div class="assist-panel-head">
      <div>
        <strong>OnBlick Audit Assistant</strong>
        <div class="note assist-context-line">${escapeHtml(contextBits.join(" · ") || "No audit context selected")}</div>
      </div>
      <div class="assist-panel-actions">
        <button type="button" class="icon-btn" data-minimize-agent title="Minimize" aria-label="Minimize assistant">—</button>
        <button type="button" class="icon-btn" data-close-agent title="Close" aria-label="Close assistant">✕</button>
      </div>
    </div>
    ${agentBusy && agentStatus ? statusBar(agentStatus) : ""}
    ${chatStarted ? chatPanel(messages) : idlePanel(employeeName, docFindingCount, documentName)}
    <div class="composer">
      <div class="composer-row">
        <input id="ask" placeholder="Ask your question" ${agentBusy ? "disabled" : ""} />
        <button class="icon-btn" type="button" title="Voice" aria-label="Voice" disabled>🎤</button>
        <button class="send" id="send" type="button" title="Send" aria-label="Send" ${
          agentBusy ? "disabled" : ""
        }>↑</button>
      </div>
      <div class="disclaimer">OnBlick Assistant may make mistakes. Please review its responses carefully. <a href="#" data-feedback>Share your feedback</a></div>
    </div>
  </aside>`);

  root.querySelector("[data-minimize-agent]")?.addEventListener("click", () => (onMinimize || onClose)?.());
  root.querySelector("[data-close-agent]")?.addEventListener("click", () => onClose?.());
  root.querySelector("#start-correction")?.addEventListener("click", onStartCorrection);
  root.querySelector("#send")?.addEventListener("click", () => {
    const input = root.querySelector("#ask");
    onSend?.(input?.value || "");
  });
  root.querySelector("#ask")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSend?.(e.target.value || "");
  });
  root.querySelector("[data-approve]")?.addEventListener("click", onApprove);
  root.querySelector("[data-reject]")?.addEventListener("click", onReject);
  root.querySelector("[data-regen]")?.addEventListener("click", onRegenerate);
  root.querySelector("[data-feedback]")?.addEventListener("click", (e) => {
    e.preventDefault();
    onFeedback?.();
  });
  return root;
}

function statusBar(text) {
  return `<div class="assist-status"><span class="spinner" aria-hidden="true"></span>${escapeHtml(text)}</div>`;
}

function idlePanel(employeeName, docErrors, docName) {
  const count = Number(docErrors) || 0;
  const focus = docName
    ? `correct <strong>${escapeHtml(employeeName || "this employee")}</strong>'s <strong>${escapeHtml(docName)}</strong>`
    : `correct <strong>${escapeHtml(employeeName || "this employee")}</strong>'s Form I-9`;
  return `
  <div class="assist-idle" id="assist-idle">
    ${icons.assistArt}
    <p>Ask <strong>OnBlick Audit Assistant</strong> to help you ${focus} based on the <strong>${count}</strong> error${
      count === 1 ? "" : "s"
    } identified for this document.</p>
    <button class="btn btn-outline" type="button" id="start-correction">✨ Start Correction Recommendation</button>
  </div>`;
}

function chatPanel(messages) {
  const msgs = (messages || [])
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
