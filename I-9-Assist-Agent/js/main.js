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
import { analyzeAudit } from "./services/auditAnalysis.js";
import { runAgentTurn, startCorrectionRecommendation } from "./services/aiAgent.js";
import { packagesFromFiles } from "./services/fileImport.js";

const headerRoot = document.getElementById("header-root");
const appRoot = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const toastRoot = document.getElementById("toast-root");

/** Prevent an older analyzeAudit completion from overwriting a newer audit run */
let analysisGeneration = 0;

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

async function confirmAudit() {
  const { confirmAuditId, audits } = getState();
  const gen = ++analysisGeneration;
  resetChat();
  const started = audits.map((a) =>
    a.id === confirmAuditId
      ? {
          ...a,
          status: "In Progress",
          initiatedAt: new Date().toISOString(),
          initiatedBy: currentUser.name,
          roster: (a.roster || []).map((e) => ({
            ...e,
            analysisStatus: "analyzing",
            errors: 0,
            completedOn: null,
            auditDate: null,
            findings: {
              purpose: "Form I-9 corrections",
              reviewedBy: "—",
              section1: [],
              section2: [],
              recommendation: "Analysis in progress for this employee.",
              auditId: a.id,
              employeeId: e.id,
              documentNames: (e.documents || []).map((d) => (typeof d === "string" ? d : d.name)),
            },
          })),
        }
      : a
  );
  setState({
    audits: started,
    showConfirm: false,
    selectedAuditId: confirmAuditId,
    selectedEmployeeId: null,
    selectedDocumentId: null,
    confirmAuditId: null,
    findingOverrides: {},
    pendingRecommendation: null,
    view: "audit",
    search: "",
    statusFilter: "all",
    auditBusy: true,
    auditProgress: "Starting Form I-9 analysis",
  });
  toast("I-9 audit initiated — analyzing imported documents", "success");

  const target = started.find((a) => a.id === confirmAuditId);
  if (!target) {
    setState({ auditBusy: false, auditProgress: null });
    return;
  }

  try {
    const completed = await analyzeAudit(target, {
      onProgress: ({ status }) => {
        if (gen !== analysisGeneration) return;
        setState({ auditBusy: true, auditProgress: status });
      },
    });
    if (gen !== analysisGeneration) return;
    const next = getState().audits.map((a) => (a.id === confirmAuditId ? completed : a));
    setState({
      audits: next,
      auditBusy: false,
      auditProgress: null,
      findingOverrides: {},
    });
    toast("Audit analysis complete", "success");
  } catch (err) {
    if (gen !== analysisGeneration) return;
    setState({ auditBusy: false, auditProgress: null });
    toast(err?.message || "Audit analysis failed", "error");
  }
}

function openEmployee(employeeId) {
  resetChat();
  const emp = getState().audits
    .flatMap((a) => a.roster || [])
    .find((e) => e.id === employeeId);
  const firstDocId = emp?.documentIds?.[0] || null;
  setState({
    selectedEmployeeId: employeeId,
    selectedDocumentId: firstDocId,
    view: "assist",
    findingOverrides: {},
    pendingRecommendation: null,
  });
}

function selectAnalysisDocument(documentId) {
  // Switching documents clears chat so Document A recommendations cannot linger on B
  resetChat();
  setState({
    selectedDocumentId: documentId,
    findingOverrides: {},
    pendingRecommendation: null,
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
  const { documentReturnView, selectedDocumentId } = getState();
  // Preserve selectedDocumentId when returning to Document Analysis so viewer stays in sync
  setState({
    view: documentReturnView || "audit",
    selectedDocumentId: documentReturnView === "assist" ? selectedDocumentId : null,
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
  const { findingOverrides, selectedDocumentId } = getState();
  const result = await withAgentStatus((onStatus) =>
    startCorrectionRecommendation(employee, findingOverrides, onStatus, selectedDocumentId)
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
  const { findingOverrides, selectedDocumentId } = getState();
  const result = await withAgentStatus((onStatus) =>
    runAgentTurn({
      userText: text,
      employee,
      findingOverrides,
      documentId: selectedDocumentId,
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
      onSelectAnalysisDocument: selectAnalysisDocument,
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
