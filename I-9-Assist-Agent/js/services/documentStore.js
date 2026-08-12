/**
 * Production live document + import package store.
 * Holds browser File objects and blob URLs from user imports.
 * Analysis and Document Analysis read from here — not from fixtures.
 */

import { extensionOf, formatBytes } from "./fileImport.js";

/** Session identity (not sample audit content). */
export const currentUser = {
  id: "session-user",
  name: "Signed-in user",
  initials: "SU",
  role: "HR",
};

/** @type {ImportPackage[]} */
let packages = [];

/** @type {Map<string, StoredDocument>} */
const documentsById = new Map();

/**
 * @typedef {object} StoredDocument
 * @property {string} id
 * @property {string} name
 * @property {string} relativePath
 * @property {number} size
 * @property {string} type
 * @property {string} packageId
 * @property {string} employeeName
 * @property {string} url
 * @property {"pdf"|"image"|"office"|"text"|"other"} kind
 * @property {string} importedAt
 * @property {File} [file]
 * @property {object} [extraction] last extraction snapshot (optional cache)
 */

function detectKind(name, mime = "") {
  const ext = extensionOf(name);
  if (mime.startsWith("text/") || ext === "txt") return "text";
  if (ext === "pdf" || mime.includes("pdf")) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext) || mime.startsWith("image/")) return "image";
  if (["doc", "docx"].includes(ext) || mime.includes("word") || mime.includes("officedocument")) {
    return "office";
  }
  return "other";
}

function toPublicDoc(doc) {
  if (!doc) return null;
  const { file: _file, ...pub } = doc;
  return {
    ...pub,
    sizeLabel: formatBytes(pub.size),
    hasFile: Boolean(doc.file),
  };
}

function registerDocument({ id, name, relativePath, size, type, file, packageId, employeeName }) {
  const existing = documentsById.get(id);
  if (existing?.url) URL.revokeObjectURL(existing.url);
  const url = URL.createObjectURL(file);
  const record = {
    id,
    name,
    relativePath: relativePath || name,
    size: size ?? file.size,
    type: type || file.type || "",
    packageId,
    employeeName,
    url,
    kind: detectKind(name, type || file.type || ""),
    importedAt: new Date().toISOString(),
    file,
    extraction: null,
  };
  documentsById.set(id, record);
  return toPublicDoc(record);
}

export function registerPackageDocuments(pkg) {
  const employees = (pkg.employees || []).map((emp) => {
    const documents = (emp.documents || []).map((d) => {
      const id = d.id || `doc-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      registerDocument({
        id,
        name: d.name,
        relativePath: d.relativePath || d.name,
        size: d.size ?? d.file?.size ?? 0,
        type: d.type || d.file?.type || "",
        file: d.file,
        packageId: pkg.id,
        employeeName: emp.name,
      });
      return {
        id,
        name: d.name,
        relativePath: d.relativePath || d.name,
        size: d.size ?? d.file?.size ?? 0,
      };
    });
    return {
      name: emp.name,
      department: emp.department || "",
      documents,
      documentIds: documents.map((d) => d.id),
      fileNames: documents.map((d) => d.name),
      documentCount: documents.length,
      totalBytes: documents.reduce((n, d) => n + (d.size || 0), 0),
    };
  });

  const allDocs = employees.flatMap((e) => e.documents);
  return {
    ...pkg,
    source: pkg.source || "upload",
    employees,
    fileNames: allDocs.map((d) => d.name),
    documentCount: allDocs.length,
    documentIds: allDocs.map((d) => d.id),
    employeeCount: employees.length,
    totalBytes: allDocs.reduce((n, d) => n + (d.size || 0), 0),
  };
}

export function getPackages() {
  return [...packages];
}

export function setPackages(next) {
  packages = [...next];
  return getPackages();
}

export function addPackage(pkg) {
  const registered = registerPackageDocuments(pkg);
  const next = [...packages];
  const existing = next.findIndex((p) => p.name === registered.name && p.source === registered.source);
  if (existing >= 0) {
    revokePackageDocuments(next[existing].id);
    next[existing] = registered;
  } else {
    next.push(registered);
  }
  packages = next;
  return registered;
}

export function removePackageAt(index) {
  const next = [...packages];
  const [removed] = next.splice(index, 1);
  if (removed?.id) revokePackageDocuments(removed.id);
  packages = next;
  return removed || null;
}

export function clearPackages() {
  packages = [];
}

export function clearAllImportData() {
  for (const p of packages) revokePackageDocuments(p.id);
  packages = [];
  clearImportedDocuments();
}

/** Public metadata for UI (no File handle). */
export function getImportedDocument(id) {
  return toPublicDoc(documentsById.get(id));
}

export function getImportedDocuments(ids = []) {
  return ids.map((id) => getImportedDocument(id)).filter(Boolean);
}

export function listImportedDocuments({ packageId, employeeName } = {}) {
  let rows = [...documentsById.values()].map(toPublicDoc);
  if (packageId) rows = rows.filter((d) => d.packageId === packageId);
  if (employeeName) rows = rows.filter((d) => d.employeeName === employeeName);
  return rows;
}

/**
 * Production analysis access — returns the live File for a document id.
 * This is the source of truth for content extraction (not fixtures).
 */
export function getDocumentFile(id) {
  const doc = documentsById.get(id);
  return doc?.file || null;
}

/** Full internal record for analysis (includes File). */
export function getDocumentRecord(id) {
  return documentsById.get(id) || null;
}

export function cacheDocumentExtraction(id, extraction) {
  const doc = documentsById.get(id);
  if (!doc) return;
  doc.extraction = extraction;
}

export function revokeImportedDocuments(ids) {
  for (const id of ids) {
    const doc = documentsById.get(id);
    if (!doc) continue;
    if (doc.url) URL.revokeObjectURL(doc.url);
    documentsById.delete(id);
  }
}

export function revokePackageDocuments(packageId) {
  const ids = [...documentsById.values()].filter((d) => d.packageId === packageId).map((d) => d.id);
  revokeImportedDocuments(ids);
}

export function clearImportedDocuments() {
  for (const doc of documentsById.values()) {
    if (doc.url) URL.revokeObjectURL(doc.url);
  }
  documentsById.clear();
}

export function getDocumentStoreSnapshot() {
  return {
    packages: getPackages(),
    documents: listImportedDocuments(),
  };
}
