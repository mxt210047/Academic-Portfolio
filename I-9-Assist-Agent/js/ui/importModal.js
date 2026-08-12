import { el } from "../utils/dom.js";
import { getState } from "../state/store.js";

export function renderImportModal({
  onClose,
  onOrgChange,
  onAddFolder,
  onRemoveFolder,
  onSaveLater,
  onInitiate,
}) {
  const state = getState();
  const root = el(`
  <div class="overlay" data-overlay="import">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div class="modal-head">
        <h3 id="import-title">Import I-9 Documents</h3>
        <button class="icon-btn" type="button" data-close aria-label="Close">✕</button>
      </div>
      <div class="field">
        <label for="org-name">Organization Name *</label>
        <input id="org-name" placeholder="Enter" value="${escapeAttr(state.orgNameDraft)}" />
        <div class="field-error ${state.orgNameDraft.trim() ? "hidden" : ""}" data-org-error>Organization name is required.</div>
      </div>
      <div class="field">
        <label>Upload I-9 Document</label>
        <div class="drop" data-drop>
          <div style="font-size:28px;color:var(--blue)">📄</div>
          <div><strong data-link>Link</strong> or drag and drop</div>
          <div class="hint">PDF, DOC, JPG or PNG (max. 25MB)</div>
        </div>
        <p class="note">Note: Please organize the folders by employee names within a master folder and upload the master folder here.</p>
      </div>
      <div class="selected">
        <h4>Selected Folders</h4>
        ${
          state.selectedFolders.length
            ? state.selectedFolders
                .map(
                  (f, i) => `
            <div class="folder-row">
              <span>📁</span><span>${escapeHtml(f.name)}</span>
              <button class="trash" type="button" data-remove="${i}" aria-label="Remove">🗑</button>
            </div>`
                )
                .join("")
            : `<div class="note">No folders selected yet.</div>`
        }
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" type="button" data-save>SAVE &amp; AUDIT LATER</button>
        <button class="btn btn-primary" type="button" data-initiate>INITIATE AUDIT</button>
      </div>
    </div>
  </div>`);

  root.addEventListener("click", (e) => {
    if (e.target === root) onClose();
  });
  root.querySelector("[data-close]").addEventListener("click", onClose);
  root.querySelector("#org-name").addEventListener("input", (e) => onOrgChange(e.target.value));
  // Dropzone / link stay empty until the user explicitly chooses a folder chip
  root.querySelector("[data-drop]").addEventListener("click", () => {});
  root.querySelector("[data-link]").addEventListener("click", (e) => {
    e.stopPropagation();
  });
  const drop = root.querySelector("[data-drop]");
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("dragover");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("dragover");
  });
  root.querySelectorAll("[data-remove]").forEach((b) =>
    b.addEventListener("click", () => onRemoveFolder(+b.getAttribute("data-remove")))
  );
  root.querySelector("[data-save]").addEventListener("click", onSaveLater);
  root.querySelector("[data-initiate]").addEventListener("click", onInitiate);
  return root;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', "&quot;");
}
