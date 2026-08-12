import { el } from "../utils/dom.js";
import { getState } from "../state/store.js";
import { formatBytes } from "../services/fileImport.js";

export function renderImportModal({
  onClose,
  onOrgChange,
  onFilesSelected,
  onRemoveFolder,
  onSaveLater,
  onInitiate,
}) {
  const state = getState();
  const canSubmit = Boolean(state.selectedFolders.length && state.orgNameDraft.trim());
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
        <input type="file" id="file-input" class="hidden" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,image/*" />
        <input type="file" id="folder-input" class="hidden" webkitdirectory directory multiple />
        <div class="drop" data-drop tabindex="0" role="button" aria-label="Upload I-9 documents">
          <div style="font-size:28px;color:var(--blue)">📄</div>
          <div><strong data-link>Link</strong> or drag and drop</div>
          <div class="hint">PDF, DOC, JPG or PNG (max. 25MB)</div>
          <div class="hint" style="margin-top:10px">
            <button type="button" class="chip-btn" data-pick-files>Choose files</button>
            <button type="button" class="chip-btn" data-pick-folder>Choose folder</button>
          </div>
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
              <span>📁</span>
              <span style="flex:1;min-width:0">
                <div>${escapeHtml(f.name)}</div>
                <div class="note">${f.documentCount} document${f.documentCount === 1 ? "" : "s"} · ${f.employeeCount} employee${f.employeeCount === 1 ? "" : "s"}${
                    f.totalBytes != null ? ` · ${formatBytes(f.totalBytes)}` : ""
                  }</div>
              </span>
              <button class="trash" type="button" data-remove="${i}" aria-label="Remove">🗑</button>
            </div>`
                )
                .join("")
            : `<div class="note">No folders selected yet. Choose files or a folder to import.</div>`
        }
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" type="button" data-save ${canSubmit ? "" : "disabled"}>SAVE &amp; AUDIT LATER</button>
        <button class="btn btn-primary" type="button" data-initiate ${canSubmit ? "" : "disabled"}>INITIATE AUDIT</button>
      </div>
    </div>
  </div>`);

  const fileInput = root.querySelector("#file-input");
  const folderInput = root.querySelector("#folder-input");
  const drop = root.querySelector("[data-drop]");

  const handleList = (list) => {
    if (!list?.length) return;
    onFilesSelected(list);
  };

  root.addEventListener("click", (e) => {
    if (e.target === root) onClose();
  });
  root.querySelector("[data-close]").addEventListener("click", onClose);
  root.querySelector("#org-name").addEventListener("input", (e) => onOrgChange(e.target.value));

  root.querySelector("[data-pick-files]").addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  root.querySelector("[data-pick-folder]").addEventListener("click", (e) => {
    e.stopPropagation();
    folderInput.click();
  });
  root.querySelector("[data-link]").addEventListener("click", (e) => {
    e.stopPropagation();
    folderInput.click();
  });
  drop.addEventListener("click", (e) => {
    if (e.target.closest("button") || e.target.closest("[data-link]")) return;
    folderInput.click();
  });
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      folderInput.click();
    }
  });

  fileInput.addEventListener("change", () => {
    handleList(fileInput.files);
    fileInput.value = "";
  });
  folderInput.addEventListener("change", () => {
    handleList(folderInput.files);
    folderInput.value = "";
  });

  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("dragover");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("dragover");
    handleList(e.dataTransfer.files);
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
