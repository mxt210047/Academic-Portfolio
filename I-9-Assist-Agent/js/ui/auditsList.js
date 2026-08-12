import { el } from "../utils/dom.js";
import { getFilteredAudits, getState } from "../state/store.js";

export function renderAuditsList({
  onImport,
  onSearch,
  onFilter,
  onSort,
  onInitiate,
}) {
  const state = getState();
  const rows = getFilteredAudits();

  const root = el(`
  <section>
    <div class="page-title-row">
      <h1 class="page-title">I-9 Audits</h1>
      <button class="btn btn-primary" type="button" data-action="import">IMPORT I-9 DOCUMENTS</button>
    </div>
    <div class="toolbar">
      <div class="search">
        <input id="audit-search" placeholder="Search audits" value="${escapeAttr(state.search)}" />
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
      </div>
      <button class="chip-btn ${state.statusFilter === "all" ? "active" : ""}" type="button" data-filter="all">All</button>
      <button class="chip-btn ${state.statusFilter === "Not Initiated" ? "active" : ""}" type="button" data-filter="Not Initiated">Not Initiated</button>
      <button class="chip-btn ${state.statusFilter === "In Progress" ? "active" : ""}" type="button" data-filter="In Progress">In Progress</button>
      <button class="chip-btn ${state.statusFilter === "Completed" ? "active" : ""}" type="button" data-filter="Completed">Completed</button>
      <button class="chip-btn" type="button" data-sort="name">Sort A–Z</button>
    </div>
    ${
      rows.length
        ? `<table class="table">
      <thead>
        <tr>
          <th style="width:36px"><input type="checkbox" aria-label="Select all" /></th>
          <th class="sortable" data-sort="name">Audit Name</th>
          <th class="sortable" data-sort="employees">Employees</th>
          <th class="sortable" data-sort="documents">Documents</th>
          <th>Audit Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (a) => `
          <tr data-audit="${a.id}">
            <td><input type="checkbox" onclick="event.stopPropagation()" /></td>
            <td><div class="cell-name"><span class="folder">📁</span>${escapeHtml(a.name)}</div></td>
            <td>${a.employees} Employees</td>
            <td>${a.documents} Documents</td>
            <td>${statusBadge(a.status)}</td>
            <td>
              ${
                a.status === "Not Initiated"
                  ? `<button class="btn btn-primary btn-sm" type="button" data-initiate="${a.id}">INITIATE AUDIT</button>`
                  : `<button class="btn btn-outline btn-sm" type="button" data-open="${a.id}">VIEW AUDIT</button>`
              }
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`
        : `<div class="empty"><div><h2>No audits match your filters</h2></div></div>`
    }
  </section>`);

  root.querySelector("[data-action=import]").addEventListener("click", onImport);
  root.querySelector("#audit-search")?.addEventListener("input", (e) => onSearch(e.target.value));
  root.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", () => onFilter(b.getAttribute("data-filter")))
  );
  root.querySelectorAll("[data-sort]").forEach((b) =>
    b.addEventListener("click", () => onSort(b.getAttribute("data-sort")))
  );
  root.querySelectorAll("[data-initiate]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onInitiate(b.getAttribute("data-initiate"));
    })
  );
  root.querySelectorAll("[data-open]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onInitiate(b.getAttribute("data-open"), { openOnly: true });
    })
  );
  return root;
}

function statusBadge(status) {
  if (status === "In Progress") return `<span class="badge badge-progress">${status}</span>`;
  if (status === "Completed") return `<span class="badge badge-ok">${status}</span>`;
  return `<span class="badge badge-muted">${status}</span>`;
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
