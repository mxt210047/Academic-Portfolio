/**
 * Shared live-document preview markup (blob URL from mockData registry).
 */

export function renderDocumentPreview(doc) {
  if (!doc) {
    return `<div class="doc-fallback"><h2>Document not found</h2><p class="note">The file may have been removed from this session.</p></div>`;
  }
  if (doc.kind === "pdf") {
    return `<iframe class="doc-frame" title="${escapeAttr(doc.name)}" src="${doc.url}#toolbar=1"></iframe>`;
  }
  if (doc.kind === "image") {
    return `<div class="doc-image-wrap"><img class="doc-image" alt="${escapeAttr(doc.name)}" src="${doc.url}" /></div>`;
  }
  if (doc.kind === "text") {
    return `<iframe class="doc-frame doc-frame-text" title="${escapeAttr(doc.name)}" src="${doc.url}"></iframe>`;
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
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', "&quot;");
}
