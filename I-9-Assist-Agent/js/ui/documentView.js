import { el } from "../utils/dom.js";
import { getImportedDocument, getImportedDocuments } from "../data/importedDocuments.js";
import { getSelectedEmployee, getSelectedAudit, getState } from "../state/store.js";

/**
 * Page that opens an imported document for preview / download.
 */
export function renderDocumentView({ onBack, onOpenDocument }) {
  const state = getState();
  const doc = getImportedDocument(state.selectedDocumentId);
  const emp = getSelectedEmployee();
  const audit = getSelectedAudit();
  const siblings = getImportedDocuments(emp?.documentIds || audit?.documentIds || []);

  if (!doc) {
    return el(`
    <section>
      <div class="crumbs"><button type="button" data-back>Back</button> &gt; Document</div>
      <div class="empty"><div><h2>Document not found</h2><p class="note">The file may have been removed from this session.</p></div></div>
    </section>`);
  }

  const preview = renderPreview(doc);

  const root = el(`
  <section>
    <div class="crumbs">
      <button type="button" data-back>Back</button> &gt;
      <span>Imported document</span>
    </div>
    <div class="page-title-row">
      <div>
        <h1 class="page-title">${escapeHtml(doc.name)}</h1>
        <div class="meta">
          ${escapeHtml(doc.employeeName || "—")} • ${escapeHtml(doc.sizeLabel)} • ${escapeHtml(doc.kind.toUpperCase())}
          ${doc.relativePath && doc.relativePath !== doc.name ? ` • ${escapeHtml(doc.relativePath)}` : ""}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn btn-outline btn-sm" href="${doc.url}" download="${escapeAttr(doc.name)}">DOWNLOAD</a>
        <a class="btn btn-primary btn-sm" href="${doc.url}" target="_blank" rel="noopener">OPEN IN NEW TAB</a>
      </div>
    </div>

    <div class="doc-layout">
      <aside class="doc-rail">
        <h4>Documents${emp ? ` · ${escapeHtml(emp.name)}` : ""}</h4>
        ${
          siblings.length
            ? siblings
                .map(
                  (d) => `
            <button type="button" class="doc-rail-item ${d.id === doc.id ? "active" : ""}" data-doc="${d.id}">
              <span class="doc-rail-name">${escapeHtml(d.name)}</span>
              <span class="note">${escapeHtml(d.kind)} · ${escapeHtml(d.sizeLabel)}</span>
            </button>`
                )
                .join("")
            : `<p class="note">No related documents.</p>`
        }
      </aside>
      <div class="doc-stage">
        ${preview}
      </div>
    </div>
  </section>`);

  root.querySelector("[data-back]").addEventListener("click", onBack);
  root.querySelectorAll("[data-doc]").forEach((btn) =>
    btn.addEventListener("click", () => onOpenDocument(btn.getAttribute("data-doc")))
  );
  return root;
}

function renderPreview(doc) {
  if (doc.kind === "pdf") {
    return `<iframe class="doc-frame" title="${escapeAttr(doc.name)}" src="${doc.url}#toolbar=1"></iframe>`;
  }
  if (doc.kind === "image") {
    return `<div class="doc-image-wrap"><img class="doc-image" alt="${escapeAttr(doc.name)}" src="${doc.url}" /></div>`;
  }
  return `
    <div class="doc-fallback">
      <h2>Preview not available in-browser</h2>
      <p class="note">${escapeHtml(doc.name)} (${escapeHtml(doc.kind)}) can be downloaded or opened in a new tab.</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap">
        <a class="btn btn-outline" href="${doc.url}" download="${escapeAttr(doc.name)}">Download file</a>
        <a class="btn btn-primary" href="${doc.url}" target="_blank" rel="noopener">Open file</a>
      </div>
    </div>`;
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
