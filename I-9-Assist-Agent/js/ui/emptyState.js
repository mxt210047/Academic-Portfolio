import { el, icons } from "../utils/dom.js";

export function renderEmptyState({ onImport }) {
  const root = el(`
  <section>
    <div class="page-title-row"><h1 class="page-title">I-9 Audits</h1></div>
    <div class="empty">
      <div>
        ${icons.emptyArt}
        <h2>No Documents Found!</h2>
        <button class="btn btn-primary" type="button" data-action="import">IMPORT I-9 DOCUMENTS</button>
      </div>
    </div>
  </section>`);
  root.querySelector("[data-action=import]").addEventListener("click", onImport);
  return root;
}
