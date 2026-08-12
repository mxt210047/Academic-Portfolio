import { el } from "../utils/dom.js";
import {
  getFilteredEmployees,
  getSelectedAudit,
  getState,
} from "../state/store.js";
import { formatDisplayDate } from "../data/models.js";
import { employeeStatusPresentation } from "../services/statusMap.js";

export function renderAuditDetail({
  onBack,
  onOpenEmployee,
  onOpenDocument,
  onSearch,
  onFilter,
  onSort,
}) {
  const state = getState();
  const audit = getSelectedAudit();
  const rows = getFilteredEmployees();

  const statusCell = (e) => {
    const s = employeeStatusPresentation(e, audit?.status);
    return `<span class="badge ${s.badge}">${escapeHtml(s.label)}</span>`;
  };

  const root = el(`
  <section>
    <div class="crumbs"><button type="button" data-back>I-9 Audits</button> &gt; View Audit</div>
    <div class="page-title-row">
      <div>
        <h1 class="page-title">${escapeHtml(audit?.name || "Audit")}</h1>
        <div class="meta">
          ${
            audit?.initiatedAt
              ? `Initiated on ${formatDisplayDate(audit.initiatedAt)} • Initiated by ${escapeHtml(audit.initiatedBy || "—")}`
              : "Not yet initiated"
          }
          ${audit?.status === "Completed" ? ` • <span class="badge badge-ok">Completed</span>` : ""}
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" type="button" data-analytics>📊 VIEW ANALYTICS</button>
        <button class="chip-btn" type="button" data-menu title="More actions">⋮</button>
      </div>
    </div>
    ${
      state.auditBusy && state.auditProgress
        ? `<div class="audit-progress"><span class="spinner" aria-hidden="true"></span>${escapeHtml(
            state.auditProgress
          )}</div>`
        : ""
    }
    <div class="toolbar">
      <div class="search">
        <input id="emp-search" placeholder="Search employees" value="${escapeAttr(state.search)}" />
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
      </div>
      <button class="chip-btn ${state.statusFilter === "all" ? "active" : ""}" type="button" data-filter="all">All</button>
      <button class="chip-btn ${state.statusFilter === "errors" ? "active" : ""}" type="button" data-filter="errors">With Errors</button>
      <button class="chip-btn ${state.statusFilter === "clean" ? "active" : ""}" type="button" data-filter="clean">No Errors</button>
      <button class="chip-btn" type="button" data-sort="errors">Sort by Errors</button>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th class="sortable" data-sort="name">Employee Name</th>
          <th class="sortable" data-sort="docs">Documents</th>
          <th class="sortable" data-sort="errors">Audit Status</th>
          <th>Audit Note</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map((e) => {
                  const firstDocId = e.documentIds?.[0];
                  return `
          <tr data-emp="${e.id}">
            <td><div class="cell-name"><span class="person">👤</span>${escapeHtml(e.name)}</div></td>
            <td>
              ${
                firstDocId
                  ? `<button class="linkish" type="button" data-docs="${e.id}" data-doc="${firstDocId}">${e.docs} Document${
                      e.docs === 1 ? "" : "s"
                    }</button>`
                  : `${e.docs} Document${e.docs === 1 ? "" : "s"}`
              }
            </td>
            <td>${statusCell(e)}</td>
            <td><button class="icon-btn" type="button" data-note="${e.id}" title="Open audit notes">📄</button></td>
          </tr>`;
                })
                .join("")
            : `<tr><td colspan="4"><div class="note">No employees in this import. Re-import a master folder organized by employee name.</div></td></tr>`
        }
      </tbody>
    </table>
  </section>`);

  root.querySelector("[data-back]").addEventListener("click", onBack);
  root.querySelector("#emp-search")?.addEventListener("input", (e) => onSearch(e.target.value));
  root.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", () => onFilter(b.getAttribute("data-filter")))
  );
  root.querySelectorAll("[data-sort]").forEach((b) =>
    b.addEventListener("click", () => onSort(b.getAttribute("data-sort")))
  );
  root.querySelectorAll("[data-emp]").forEach((row) =>
    row.addEventListener("click", () => onOpenEmployee(row.getAttribute("data-emp")))
  );
  root.querySelectorAll("[data-note]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onOpenEmployee(btn.getAttribute("data-note"));
    })
  );
  root.querySelectorAll("[data-docs]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onOpenDocument(btn.getAttribute("data-doc"), btn.getAttribute("data-docs"));
    })
  );
  root.querySelector("[data-analytics]")?.addEventListener("click", () => {
    const completed = rows.filter((r) => r.analysisStatus === "completed");
    const withErrors = completed.filter((r) => r.errors > 0).length;
    const totalFindings = rows.reduce((n, r) => n + (Number(r.errors) || 0), 0);
    alert(
      `Analytics snapshot\n\nEmployees in view: ${rows.length}\nAnalyzed: ${completed.length}\nWith errors: ${withErrors}\nClean: ${
        completed.length - withErrors
      }\nTotal findings: ${totalFindings}\nAudit status: ${audit?.status || "—"}`
    );
  });
  root.querySelector("[data-menu]")?.addEventListener("click", () => {
    const lines = [
      `Audit: ${audit?.name || "—"}`,
      `Id: ${audit?.id || "—"}`,
      `Status: ${audit?.status || "—"}`,
      `Employees: ${audit?.employees ?? rows.length}`,
      `Documents: ${audit?.documents ?? "—"}`,
      `Initiated by: ${audit?.initiatedBy || "—"}`,
    ].join("\n");
    alert(`Audit actions\n\n${lines}`);
  });
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
