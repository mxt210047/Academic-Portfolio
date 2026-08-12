import { el, icons } from "../utils/dom.js";
import { getState } from "../state/store.js";

export function renderConfirmModal({ onExit, onConfirm }) {
  const state = getState();
  const audit = state.audits.find((a) => a.id === state.confirmAuditId);
  const employees = audit?.employees ?? 0;
  const documents = audit?.documents ?? 0;

  const root = el(`
  <div class="overlay" data-overlay="confirm">
    <div class="modal wide" role="dialog" aria-modal="true">
      ${icons.confirmArt}
      <div class="confirm-copy">
        <h3>Confirm I-9 Audit</h3>
        <p>You are about to initiate an I-9 audit for <strong>${employees} employees</strong> with <strong>${documents.toLocaleString()} documents.</strong> This process may take some time to complete.</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" type="button" data-exit>EXIT</button>
        <button class="btn btn-primary" type="button" data-confirm>YES, CONFIRM</button>
      </div>
    </div>
  </div>`);

  root.querySelector("[data-exit]").addEventListener("click", onExit);
  root.querySelector("[data-confirm]").addEventListener("click", onConfirm);
  return root;
}
