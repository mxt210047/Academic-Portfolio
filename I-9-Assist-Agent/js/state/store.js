import {
  availableFolders,
  createEmptyAudits,
  currentUser,
  employeeCatalog,
} from "../data/mockData.js";

const listeners = new Set();

const state = {
  view: "empty", // empty | list | audit | assist
  audits: createEmptyAudits(),
  selectedAuditId: null,
  selectedEmployeeId: null,
  selectedFolders: [],
  orgNameDraft: "",
  search: "",
  statusFilter: "all",
  sortKey: "name",
  sortDir: "asc",
  showImport: false,
  showConfirm: false,
  confirmAuditId: null,
  agentStatus: null, // user-facing status string
  agentBusy: false,
  chatStarted: false,
  messages: [],
  pendingRecommendation: null,
  findingOverrides: {}, // findingId -> status
  toasts: [],
};

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  listeners.forEach((fn) => fn(getState()));
}

export function setState(patch) {
  Object.assign(state, patch);
  notify();
}

export function toast(message, type = "info") {
  const id = `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.toasts = [...state.toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    state.toasts = state.toasts.filter((t) => t.id !== id);
    notify();
  }, 3200);
}

export function getSelectedAudit() {
  return state.audits.find((a) => a.id === state.selectedAuditId) || null;
}

export function getSelectedEmployee() {
  return employeeCatalog.find((e) => e.id === state.selectedEmployeeId) || null;
}

export function getFilteredEmployees() {
  let rows = [...employeeCatalog];
  const q = state.search.trim().toLowerCase();
  if (q) rows = rows.filter((e) => e.name.toLowerCase().includes(q));
  if (state.statusFilter === "errors") rows = rows.filter((e) => e.errors > 0);
  if (state.statusFilter === "clean") rows = rows.filter((e) => e.errors === 0);
  rows.sort((a, b) => {
    const dir = state.sortDir === "asc" ? 1 : -1;
    if (state.sortKey === "errors") return (a.errors - b.errors) * dir;
    if (state.sortKey === "docs") return (a.docs - b.docs) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
  return rows;
}

export function getFilteredAudits() {
  let rows = [...state.audits];
  const q = state.search.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.folderName.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );
  }
  if (state.statusFilter !== "all") {
    rows = rows.filter((a) => a.status === state.statusFilter);
  }
  rows.sort((a, b) => {
    const dir = state.sortDir === "asc" ? 1 : -1;
    if (state.sortKey === "employees") return (a.employees - b.employees) * dir;
    if (state.sortKey === "documents") return (a.documents - b.documents) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
  return rows;
}

export function resetChat() {
  state.chatStarted = false;
  state.messages = [];
  state.pendingRecommendation = null;
  state.agentStatus = null;
  state.agentBusy = false;
}

export { availableFolders, currentUser };
