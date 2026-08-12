/**
 * AI Agent widget launcher — Figma-aligned access point for OnBlick Audit Assistant.
 * Closed: floating launcher. Open: existing agent panel is shown by the host view.
 * Does not own audit/document state — only open/closed UI for the agent.
 */

import { el } from "../utils/dom.js";
import {
  getSelectedAudit,
  getSelectedEmployee,
  getState,
} from "../state/store.js";
import { getImportedDocument } from "../services/documentStore.js";

/**
 * @param {{ onOpen: () => void, onClose?: () => void }} handlers
 */
export function renderAiAgentWidget({ onOpen }) {
  const state = getState();
  const audit = getSelectedAudit();
  const emp = getSelectedEmployee();
  const doc = state.selectedDocumentId ? getImportedDocument(state.selectedDocumentId) : null;

  // Launcher visible whenever the agent panel is closed and we are past empty import
  const showLauncher =
    !state.agentPanelOpen &&
    state.view !== "empty" &&
    !state.showImport &&
    !state.showConfirm;

  if (!showLauncher) {
    return el(`<div class="ai-agent-widget-host" hidden aria-hidden="true"></div>`);
  }

  const contextLabel = emp
    ? `${emp.name}${doc ? ` · ${doc.name}` : ""}`
    : audit
      ? `${audit.name} · open an Audit Note for document context`
      : "Import and open an audit to assist";

  const findingHint =
    emp?.analysisStatus === "completed"
      ? `${Number(emp.errors) || 0} packet finding(s)`
      : emp
        ? "Analysis pending"
        : "";

  const root = el(`
  <div class="ai-agent-widget-host">
    <button type="button" class="ai-agent-widget" data-open-agent
      aria-label="Open OnBlick Audit Assistant"
      title="Open OnBlick Audit Assistant">
      <span class="ai-agent-widget-icon" aria-hidden="true">✨</span>
      <span class="ai-agent-widget-copy">
        <span class="ai-agent-widget-title">OnBlick Audit Assistant</span>
        <span class="ai-agent-widget-sub">${escapeHtml(contextLabel)}${
          findingHint ? ` · ${escapeHtml(findingHint)}` : ""
        }</span>
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
