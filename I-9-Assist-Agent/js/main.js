import { renderHeader } from "./ui/header.js";
import { renderEmptyState } from "./ui/emptyState.js";
import { renderAuditsList } from "./ui/auditsList.js";
import { renderImportModal } from "./ui/importModal.js";
import { renderConfirmModal } from "./ui/confirmModal.js";
import { renderAuditDetail } from "./ui/auditDetail.js";
import { renderAssistView } from "./ui/assistView.js";
import { renderDocumentView } from "./ui/documentView.js";
import { renderToasts } from "./ui/toast.js";
import {
  currentUser,
  getSelectedEmployee,
  getState,
  resetChat,
  setState,
  subscribe,
  toast,
} from "./state/store.js";
import { buildAuditFromImport } from "./data/models.js";
import {
  addPackage,
  clearPackages,
  getPackages,
  removePackageAt,
} from "./data/mockData.js";
import { runAgentTurn, startCorrectionRecommendation } from "./services/aiAgent.js";
import { packagesFromFiles } from "./services/fileImport.js";

const headerRoot = document.getElementById("header-root");
const appRoot = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const toastRoot = document.getElementById("toast-root");

renderHeader(headerRoot);

function syncSelectedFromMockData() {
  setState({ selectedFolders: getPackages() });
}

function openImport() {
  setState({
    showImport: true,
    orgNameDraft: getState().orgNameDraft || "",
    selectedFolders: getPackages(),
  });
}

function closeImport() {
  setState({ showImport: false });
}

function addImportedFiles(fileList) {
  const { packages, errors } = packagesFromFiles(fileList);
  errors.forEach((msg) => toast(msg, "warn"));
  if (!packages.length) return;

  for (const raw of packages) {
    addPackage(raw);
  }
  syncSelectedFromMockData();
  toast(
    packages.length === 1
      ? `Imported “${packages[0].name}” (${packages[0].documentCount} docs) into mockData`
      : `Imported ${packages.length} packets into mockData`,
    "success"
  );
}

function removeFolder(index) {
  removePackageAt(index);
  syncSelectedFromMockData();
}

function validateImport() {
  const orgNameDraft = getState().orgNameDraft;
  const selectedFolders = getPackages();
  if (!orgNameDraft.trim()) {
    toast("Enter an organization name", "error");
    return false;
  }
  if (!selectedFolders.length) {
    toast("Choose files or a folder to import", "error");
    return false;
  }
  return true;
}

function createAuditsFromSelection() {
  const orgNameDraft = getState().orgNameDraft;
  const selectedFolders = getPackages();
  const { audits } = getState();
  const created = selectedFolders.map((folder, i) =>
    buildAuditFromImport(
      folder,
      i === 0 ? orgNameDraft.trim() : `${orgNameDraft.trim()} · ${folder.name}`
    )
  );
  return { next: [...audits, ...created], created };
}

function saveLater() {
  if (!validateImport()) return;
  const { next } = createAuditsFromSelection();
  clearPackages();
  setState({
    audits: next,
    selectedFolders: [],
    showImport: false,
    view: "list",
    search: "",
    statusFilter: "all",
  });
  toast("Audit saved for later", "success");
}

function initiateFromImport() {
  if (!validateImport()) return;
  const { next, created } = createAuditsFromSelection();
  clearPackages();
  setState({
    audits: next,
    selectedFolders: [],
    showImport: false,
    showConfirm: true,
    confirmAuditId: created[0].id,
    view: "list",
    search: "",
    statusFilter: "all",
  });
}

function initiateFromList(auditId, opts = {}) {
  const audit = getState().audits.find((a) => a.id === auditId);
  if (!audit) return;
  if (opts.openOnly || audit.status !== "Not Initiated") {
    setState({
      selectedAuditId: auditId,
      view: "audit",
      search: "",
      statusFilter: "all",
      sortKey: "name",
      sortDir: "asc",
    });
    return;
  }
  setState({ showConfirm: true, confirmAuditId: auditId });
}

function confirmAudit() {
  const { confirmAuditId, audits } = getState();
  const next = audits.map((a) =>
    a.id === confirmAuditId
      ? {
          ...a,
          status: "In Progress",
          initiatedAt: new Date().toISOString(),
          initiatedBy: currentUser.name,
        }
      : a
  );
  setState({
    audits: next,
    showConfirm: false,
    selectedAuditId: confirmAuditId,
    confirmAuditId: null,
    view: "audit",
    search: "",
    statusFilter: "all",
  });
  toast("I-9 audit initiated", "success");
}

function openEmployee(employeeId) {
  resetChat();
  setState({
    selectedEmployeeId: employeeId,
    view: "assist",
    findingOverrides: { ...getState().findingOverrides },
  });
}

function openDocument(documentId, employeeId = null) {
  const state = getState();
  setState({
    selectedDocumentId: documentId,
    selectedEmployeeId: employeeId || state.selectedEmployeeId,
    documentReturnView: state.view === "document" ? state.documentReturnView : state.view,
    view: "document",
  });
}

function closeDocument() {
  const { documentReturnView } = getState();
  setState({
    view: documentReturnView || "audit",
    selectedDocumentId: null,
  });
}

async function withAgentStatus(work) {
  setState({ agentBusy: true, agentStatus: "Analyzing request" });
  try {
    return await work((status) => setState({ agentStatus: status, agentBusy: true }));
  } finally {
    setState({ agentBusy: false, agentStatus: null });
  }
}

function pushMessages(...msgs) {
  setState({ messages: [...getState().messages, ...msgs], chatStarted: true });
  queueMicrotask(() => {
    const chat = document.getElementById("assist-chat");
    chat?.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
  });
}

async function handleStartCorrection() {
  const employee = getSelectedEmployee();
  if (!employee) return;
  const result = await withAgentStatus((onStatus) =>
    startCorrectionRecommendation(employee, getState().findingOverrides, onStatus)
  );
  pushMessages({
    role: "bot",
    kind: result.kind,
    html: result.text,
    text: result.text,
  });
  if (result.recommendation) {
    setState({ pendingRecommendation: result.recommendation });
  }
}

async function handleSend(raw) {
  const text = (raw || "").trim();
  if (!text || getState().agentBusy) return;
  const employee = getSelectedEmployee();
  if (!employee) return;

  pushMessages({ role: "user", text, html: escapeHtml(text) });
  // clear input via re-render
  const result = await withAgentStatus((onStatus) =>
    runAgentTurn({
      userText: text,
      employee,
      findingOverrides: getState().findingOverrides,
      onStatus,
    })
  );

  if (result.kind === "approve") {
    applyPendingRecommendation();
  } else if (result.kind === "reject") {
    setState({ pendingRecommendation: null });
  } else if (result.recommendation) {
    setState({ pendingRecommendation: result.recommendation });
  }

  pushMessages({
    role: "bot",
    kind: result.kind,
    html: result.text,
    text: result.text,
  });
}

function applyPendingRecommendation() {
  const pending = getState().pendingRecommendation;
  if (!pending?.findingIds?.length) {
    toast("No pending recommendation to approve", "warn");
    return;
  }
  const overrides = { ...getState().findingOverrides };
  pending.findingIds.forEach((id) => {
    overrides[id] = "in_remediation";
  });
  setState({ findingOverrides: overrides, pendingRecommendation: null });
  toast("Recommendation approved — findings marked in remediation", "success");
}

function rejectPendingRecommendation() {
  setState({ pendingRecommendation: null });
  pushMessages({
    role: "bot",
    kind: "answer",
    html: "Recommendation rejected. You can regenerate a new plan anytime.",
    text: "Recommendation rejected.",
  });
  toast("Recommendation rejected", "warn");
}

async function regenerateRecommendation() {
  await handleStartCorrection();
}

function toggleSort(key) {
  const state = getState();
  if (state.sortKey === key) {
    setState({ sortDir: state.sortDir === "asc" ? "desc" : "asc" });
  } else {
    setState({ sortKey: key, sortDir: "asc" });
  }
}

function render() {
  const state = getState();
  let page;
  if (state.view === "empty") {
    page = renderEmptyState({ onImport: openImport });
  } else if (state.view === "list") {
    page = renderAuditsList({
      onImport: openImport,
      onSearch: (v) => setState({ search: v }),
      onFilter: (v) => setState({ statusFilter: v }),
      onSort: toggleSort,
      onInitiate: initiateFromList,
    });
  } else if (state.view === "audit") {
    page = renderAuditDetail({
      onBack: () => setState({ view: "list", search: "", statusFilter: "all" }),
      onOpenEmployee: openEmployee,
      onOpenDocument: (docId, empId) => openDocument(docId, empId),
      onSearch: (v) => setState({ search: v }),
      onFilter: (v) => setState({ statusFilter: v }),
      onSort: toggleSort,
    });
  } else if (state.view === "document") {
    page = renderDocumentView({
      onBack: closeDocument,
      onOpenDocument: (docId) => openDocument(docId),
    });
  } else {
    page = renderAssistView({
      onBackToList: () => {
        resetChat();
        setState({ view: "list", search: "", statusFilter: "all" });
      },
      onBackToAudit: () => {
        resetChat();
        setState({ view: "audit", search: "", statusFilter: "all" });
      },
      onOpenDocument: (docId) => openDocument(docId),
      onStartCorrection: handleStartCorrection,
      onSend: handleSend,
      onApprove: () => {
        applyPendingRecommendation();
        pushMessages({
          role: "bot",
          kind: "answer",
          html: "Approved. Findings linked to the plan are now in remediation.",
          text: "Approved.",
        });
      },
      onReject: rejectPendingRecommendation,
      onRegenerate: regenerateRecommendation,
    });
  }
  appRoot.replaceChildren(page);

  modalRoot.replaceChildren();
  if (state.showImport) {
    modalRoot.appendChild(
      renderImportModal({
        onClose: closeImport,
        onOrgChange: (v) => setState({ orgNameDraft: v }),
        onFilesSelected: addImportedFiles,
        onRemoveFolder: removeFolder,
        onSaveLater: saveLater,
        onInitiate: initiateFromImport,
      })
    );
  }
  if (state.showConfirm) {
    modalRoot.appendChild(
      renderConfirmModal({
        onExit: () => setState({ showConfirm: false, confirmAuditId: null }),
        onConfirm: confirmAudit,
      })
    );
  }
  renderToasts(toastRoot);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

subscribe(render);
render();
