/**
 * AI Assist Agent widget — Document Analysis page only.
 * Closed launcher for the existing OnBlick Audit Assistant panel.
 * Does not own audit/document state.
 */

import { el } from "../utils/dom.js";

/**
 * @param {{
 *   employeeName?: string,
 *   documentName?: string,
 *   documentId?: string,
 *   docFindingCount?: number,
 *   onOpen: () => void,
 * }} props
 */
export function renderAiAgentWidget({
  employeeName,
  documentName,
  documentId,
  docFindingCount = 0,
  onOpen,
}) {
  const contextLabel = [employeeName, documentName].filter(Boolean).join(" · ") || "Current document";
  const findingHint = `${Number(docFindingCount) || 0} finding(s) on this document`;

  const root = el(`
  <div class="ai-agent-widget-host" data-doc-analysis-widget data-document-id="${escapeAttr(
    documentId || ""
  )}">
    <button type="button" class="ai-agent-widget" data-open-agent
      aria-label="Open OnBlick Audit Assistant"
      title="Open OnBlick Audit Assistant for this document">
      <span class="ai-agent-widget-icon" aria-hidden="true">✨</span>
      <span class="ai-agent-widget-copy">
        <span class="ai-agent-widget-title">OnBlick Audit Assistant</span>
        <span class="ai-agent-widget-sub">${escapeHtml(contextLabel)} · ${escapeHtml(findingHint)}</span>
      </span>
    </button>
  </div>`);

  root.querySelector("[data-open-agent]")?.addEventListener("click", onOpen);
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
